import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { ChapterGateState } from "./progression.service";

export async function loadChapterGateStates(courseId: string, enrollmentId: string): Promise<ChapterGateState[]> {
  const chapters = await prisma.courseChapter.findMany({
    where: { courseId }, orderBy: { displayOrder: "asc" },
    include: {
      lessons: {
        orderBy: { displayOrder: "asc" },
        include: {
          progress: { where: { enrollmentId }, select: { status: true } },
          assessments: { where: { isPublished: true, isRequired: true, stage: "POSTTEST" },
            include: { attempts: { where: { enrollmentId, passed: true }, select: { id: true } } } },
          games: { where: { isPublished: true, isRequired: true },
            include: { attempts: { where: { enrollmentId, passed: true }, select: { id: true } } } },
          assignments: { where: { isPublished: true, isRequired: true },
            include: { submissions: { where: { enrollmentId, status: "GRADED" }, select: { id: true } } } },
        },
      },
      assessments: { where: { isPublished: true, isRequired: true, stage: { in: ["PRETEST", "CHAPTER_EXAM"] } },
        include: { attempts: { where: { enrollmentId, passed: true }, select: { id: true } } } },
    },
  });
  return chapters.map((chapter) => {
    const policy = (chapter.gatePolicy ?? {}) as {
      pretestRequiredBeforeLessons?: boolean;
      requireAllLessonsCompleted?: boolean;
      requireChapterExamPassed?: boolean;
    };
    const pretests = chapter.assessments.filter((row) => row.stage === "PRETEST");
    const exams = chapter.assessments.filter((row) => row.stage === "CHAPTER_EXAM");
    return {
      id: chapter.id, required: chapter.isRequired, published: chapter.isPublished,
      pretestRequired: Boolean(policy.pretestRequiredBeforeLessons && pretests.length),
      pretestPassed: pretests.length > 0 && pretests.every((row) => row.attempts.length > 0),
      allLessonsRequired: policy.requireAllLessonsCompleted ?? true,
      examRequired: Boolean((policy.requireChapterExamPassed ?? true) && exams.length),
      examPassed: exams.length > 0 && exams.every((row) => row.attempts.length > 0),
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson.id, required: lesson.isRequired,
        completed: lesson.progress.some((row) => row.status === "COMPLETED"),
        posttestRequired: lesson.assessments.length > 0,
        posttestPassed: lesson.assessments.length > 0 && lesson.assessments.every((row) => row.attempts.length > 0),
        gameRequired: lesson.games.length > 0,
        gamesCompleted: lesson.games.length > 0 && lesson.games.every((row) => row.attempts.length > 0),
        assignmentRequired: lesson.assignments.length > 0,
        assignmentSubmitted: lesson.assignments.length > 0 && lesson.assignments.every((row) => row.submissions.length > 0),
      })),
    };
  });
}
export async function getActiveEnrollmentForCourse(courseId: string, userId: string) {
  return prisma.learningEnrollment.findFirst({
    where: {
      courseId, userId, status: { in: ["ACTIVE", "COMPLETED"] }, accessStartsAt: { lte: new Date() },
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
  });
}
