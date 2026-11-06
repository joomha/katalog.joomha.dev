import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireLearningUser } from "./identity.adapter";
import { canAccessChapter, canStartLessons, chapterComplete } from "./progression.service";
import { getActiveEnrollmentForCourse, loadChapterGateStates } from "./progression-query.service";

export async function getEnrolledCoursePlayer(slug: string) {
  const user = await requireLearningUser();
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, description: true },
  });
  if (!course) return null;
  const enrollment = await getActiveEnrollmentForCourse(course.id, user.id);
  if (!enrollment) throw new Error("Enrollment aktif tidak ditemukan.");
  const [chapters, gates, finalAssessments, certificate] = await Promise.all([
    prisma.courseChapter.findMany({
      where: { courseId: course.id, isPublished: true }, orderBy: { displayOrder: "asc" },
      include: {
        lessons: {
          where: { isPublished: true }, orderBy: { displayOrder: "asc" },
          include: {
            progress: { where: { enrollmentId: enrollment.id }, select: { status: true } },
            contentBlocks: {
              orderBy: { displayOrder: "asc" },
              include: { contentProgress: { where: { enrollmentId: enrollment.id }, select: { completedAt: true } } },
            },
            assessments: { where: { isPublished: true, stage: "POSTTEST" }, select: { id: true, stage: true, title: true, isRequired: true } },
            games: { where: { isPublished: true }, select: { id: true, title: true, type: true, isRequired: true } },
            assignments: { where: { isPublished: true }, select: { id: true, title: true, instructions: true, isRequired: true } },
          },
        },
        assessments: {
          where: { isPublished: true, stage: { in: ["PRETEST", "CHAPTER_EXAM"] } },
          select: { id: true, stage: true, title: true, isRequired: true },
        },
      },
    }),
    loadChapterGateStates(course.id, enrollment.id),
    prisma.assessment.findMany({
      where: { courseId: course.id, stage: "FINAL_EXAM", isPublished: true },
      select: { id: true, title: true, isRequired: true },
    }),
    prisma.learningCertificate.findUnique({
      where: { enrollmentId: enrollment.id },
      select: { verificationCode: true, certificateNumber: true, status: true },
    }),
  ]);
  const indexById = new Map(gates.map((chapter, index) => [chapter.id, index]));
  return {
    course,
    enrollment: { id: enrollment.id, enrolledAt: enrollment.enrolledAt, completedAt: enrollment.completedAt, status: enrollment.status },
    chapters: chapters.map((chapter) => {
      const index = indexById.get(chapter.id) ?? -1;
      const chapterGate = canAccessChapter(index, gates);
      const state = gates[index];
      const lessonGate = state ? canStartLessons(state) : { allowed: false, reason: "CHAPTER_NOT_PUBLISHED" as const, blockingIds: [chapter.id] };
      return {
        id: chapter.id, slug: chapter.slug, title: chapter.title, description: chapter.description,
        displayOrder: chapter.displayOrder, isUnlocked: chapterGate.allowed,
        isLessonContentUnlocked: chapterGate.allowed && lessonGate.allowed,
        lessonGateReason: lessonGate.reason,
        isComplete: state ? chapterComplete(state) : false,
        chapterAssessments: chapter.assessments,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id, slug: lesson.slug, title: lesson.title, description: lesson.description,
          displayOrder: lesson.displayOrder, isRequired: lesson.isRequired,
          isCompleted: lesson.progress[0]?.status === "COMPLETED",
          contentBlocks: chapterGate.allowed && lessonGate.allowed ? lesson.contentBlocks.map((block) => ({
            id: block.id, type: block.type, title: block.title, body: block.body,
            resourceUrl: block.type === "FILE" ? null : block.resourceUrl,
            codeLanguage: block.codeLanguage, displayOrder: block.displayOrder,
            isCompleted: block.contentProgress.some((row) => row.completedAt !== null),
          })) : [],
          assessments: lessonGate.allowed ? lesson.assessments : [], games: lessonGate.allowed && lesson.progress[0]?.status === "COMPLETED" ? lesson.games : [], assignments: lessonGate.allowed ? lesson.assignments : [],
        })),
      };
    }),
    finalAssessments, certificate,
  };
}
