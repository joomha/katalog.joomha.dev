import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireLearningUser } from "./identity.adapter";
import { canAccessChapter } from "./progression.service";
import { getActiveEnrollmentForCourse, loadChapterGateStates } from "./progression-query.service";

async function resolveLessonContext(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: { select: { id: true, courseId: true } }, contentBlocks: { where: { isRequired: true }, select: { id: true } } },
  });
  if (!lesson || !lesson.isPublished) throw new Error("Lesson tidak ditemukan atau belum diterbitkan.");
  const enrollment = await getActiveEnrollmentForCourse(lesson.chapter.courseId, userId);
  if (!enrollment) throw new Error("Enrollment aktif tidak ditemukan.");
  const states = await loadChapterGateStates(lesson.chapter.courseId, enrollment.id);
  const index = states.findIndex((chapter) => chapter.id === lesson.chapterId);
  if (!canAccessChapter(index, states).allowed) throw new Error("Chapter masih terkunci.");
  return { lesson, enrollment, requiredBlockIds: lesson.contentBlocks.map((block) => block.id) };
}
export async function markContentBlockViewed(contentBlockId: string) {
  const user = await requireLearningUser();
  const block = await prisma.lessonContentBlock.findUnique({ where: { id: contentBlockId }, select: { id: true, lessonId: true } });
  if (!block) throw new Error("Materi tidak ditemukan.");
  const context = await resolveLessonContext(block.lessonId, user.id);
  return prisma.lessonContentProgress.upsert({
    where: { enrollmentId_contentBlockId: { enrollmentId: context.enrollment.id, contentBlockId } },
    create: { enrollmentId: context.enrollment.id, contentBlockId, lastViewedAt: new Date(), completedAt: new Date() },
    update: { lastViewedAt: new Date(), completedAt: new Date() },
  });
}
export async function markLessonStarted(lessonId: string) {
  const user = await requireLearningUser();
  const context = await resolveLessonContext(lessonId, user.id);
  return prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: context.enrollment.id, lessonId } },
    create: { enrollmentId: context.enrollment.id, lessonId, status: "IN_PROGRESS", startedAt: new Date(), lastViewedAt: new Date() },
    update: { status: "IN_PROGRESS", lastViewedAt: new Date() },
  });
}
export async function markLessonCompleted(lessonId: string) {
  const user = await requireLearningUser();
  const context = await resolveLessonContext(lessonId, user.id);
  if (context.requiredBlockIds.length) {
    const completed = await prisma.lessonContentProgress.count({
      where: { enrollmentId: context.enrollment.id, contentBlockId: { in: context.requiredBlockIds }, completedAt: { not: null } },
    });
    if (completed < context.requiredBlockIds.length) throw new Error("Selesaikan semua materi wajib sebelum menyelesaikan lesson.");
  }
  const posttests = await prisma.assessment.findMany({
    where: { lessonId, isPublished: true, isRequired: true, stage: "POSTTEST" }, select: { id: true },
  });
  for (const assessment of posttests) {
    const passed = await prisma.assessmentAttempt.count({
      where: { enrollmentId: context.enrollment.id, assessmentId: assessment.id, passed: true },
    });
    if (!passed) throw new Error("Selesaikan posttest lesson sebelum menandai lesson selesai.");
  }
  return prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: context.enrollment.id, lessonId } },
    create: { enrollmentId: context.enrollment.id, lessonId, status: "COMPLETED", completionPercent: 100, startedAt: new Date(), completedAt: new Date(), lastViewedAt: new Date() },
    update: { status: "COMPLETED", completionPercent: 100, completedAt: new Date(), lastViewedAt: new Date() },
  });
}
