import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireLearningUser } from "./identity.adapter";
import { canAccessChapter, canStartLessons } from "./progression.service";
import { getActiveEnrollmentForCourse, loadChapterGateStates } from "./progression-query.service";

async function resolveLessonContext(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      chapter: { select: { id: true, courseId: true } },
      contentBlocks: { where: { isRequired: true }, select: { id: true } },
    },
  });
  if (!lesson || !lesson.isPublished) throw new Error("Lesson tidak ditemukan atau belum diterbitkan.");
  const enrollment = await getActiveEnrollmentForCourse(lesson.chapter.courseId, userId);
  if (!enrollment) throw new Error("Enrollment aktif tidak ditemukan.");
  const states = await loadChapterGateStates(lesson.chapter.courseId, enrollment.id);
  const chapterIndex = states.findIndex((chapter) => chapter.id === lesson.chapterId);
  if (!canAccessChapter(chapterIndex, states).allowed) throw new Error("Chapter masih terkunci.");
  const chapter = states[chapterIndex];
  if (!chapter || !canStartLessons(chapter).allowed) throw new Error("Luluskan pretest wajib sebelum membuka materi chapter.");
  return { lesson, enrollment, requiredBlockIds: lesson.contentBlocks.map((block) => block.id) };
}

export async function markContentBlockViewed(contentBlockId: string) {
  const user = await requireLearningUser();
  const block = await prisma.lessonContentBlock.findUnique({
    where: { id: contentBlockId }, select: { id: true, lessonId: true },
  });
  if (!block) throw new Error("Materi tidak ditemukan.");
  const context = await resolveLessonContext(block.lessonId, user.id);
  const now = new Date();
  return prisma.lessonContentProgress.upsert({
    where: { enrollmentId_contentBlockId: { enrollmentId: context.enrollment.id, contentBlockId } },
    create: { enrollmentId: context.enrollment.id, contentBlockId, lastViewedAt: now, completedAt: now },
    update: { lastViewedAt: now, completedAt: now },
  });
}

export async function markLessonStarted(lessonId: string) {
  const user = await requireLearningUser();
  const context = await resolveLessonContext(lessonId, user.id);
  const existing = await prisma.lessonProgress.findUnique({
    where: { enrollmentId_lessonId: { enrollmentId: context.enrollment.id, lessonId } },
  });
  if (existing?.status === "COMPLETED") return existing;
  const now = new Date();
  return prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: context.enrollment.id, lessonId } },
    create: { enrollmentId: context.enrollment.id, lessonId, status: "IN_PROGRESS", startedAt: now, lastViewedAt: now },
    update: { status: "IN_PROGRESS", startedAt: existing?.startedAt ?? now, lastViewedAt: now },
  });
}

export async function markLessonCompleted(lessonId: string) {
  const user = await requireLearningUser();
  const context = await resolveLessonContext(lessonId, user.id);
  const existing = await prisma.lessonProgress.findUnique({
    where: { enrollmentId_lessonId: { enrollmentId: context.enrollment.id, lessonId } },
  });
  if (existing?.status === "COMPLETED") return existing;

  if (context.requiredBlockIds.length) {
    const completed = await prisma.lessonContentProgress.count({
      where: {
        enrollmentId: context.enrollment.id,
        contentBlockId: { in: context.requiredBlockIds },
        completedAt: { not: null },
      },
    });
    if (completed < context.requiredBlockIds.length) throw new Error("Selesaikan semua materi wajib sebelum menyelesaikan lesson.");
  }

  const posttests = await prisma.assessment.findMany({
    where: { lessonId, isPublished: true, isRequired: true, stage: "POSTTEST" },
    select: { id: true },
  });
  for (const assessment of posttests) {
    const passed = await prisma.assessmentAttempt.count({
      where: { enrollmentId: context.enrollment.id, assessmentId: assessment.id, passed: true },
    });
    if (!passed) throw new Error("Selesaikan posttest lesson sebelum menandai lesson selesai.");
  }

  const now = new Date();
  return prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: context.enrollment.id, lessonId } },
    create: {
      enrollmentId: context.enrollment.id, lessonId, status: "COMPLETED",
      completionPercent: 100, startedAt: now, completedAt: now, lastViewedAt: now,
    },
    update: { status: "COMPLETED", completionPercent: 100, completedAt: now, lastViewedAt: now },
  });
}
