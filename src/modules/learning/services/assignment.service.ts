import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AssignmentSubmissionSchema } from "../schemas/course.schema";
import { requireLearningManager, requireLearningUser } from "./identity.adapter";

const AssignmentAuthoringSchema = z.object({
  courseId: z.string().uuid(), chapterId: z.string().uuid().optional(), lessonId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200), description: z.string().max(10_000).optional(),
  instructions: z.string().trim().min(1).max(20_000), maxScore: z.number().positive().max(1_000).default(100),
  dueAfterDays: z.number().int().positive().max(365).nullable().default(null),
  allowLateSubmission: z.boolean().default(true), isRequired: z.boolean().default(false),
  isPublished: z.boolean().default(false), displayOrder: z.number().int().min(0).default(0),
});
export async function createAssignment(input: unknown) {
  await requireLearningManager();
  const parsed = AssignmentAuthoringSchema.parse(input);
  const course = await prisma.course.findUnique({ where: { id: parsed.courseId } });
  if (!course || course.status === "PUBLISHED") throw new Error("Course tidak ditemukan atau sudah dipublikasikan.");
  if (parsed.chapterId) {
    const chapter = await prisma.courseChapter.findFirst({ where: { id: parsed.chapterId, courseId: parsed.courseId } });
    if (!chapter) throw new Error("Chapter bukan bagian dari course ini.");
  }
  if (parsed.lessonId) {
    const lesson = await prisma.lesson.findFirst({ where: { id: parsed.lessonId, chapterId: parsed.chapterId, chapter: { courseId: parsed.courseId } } });
    if (!lesson) throw new Error("Lesson bukan bagian dari chapter/course ini.");
  }
  return prisma.learningAssignment.create({ data: parsed });
}
export async function publishAssignment(assignmentId: string) {
  await requireLearningManager();
  const assignment = await prisma.learningAssignment.findUnique({ where: { id: assignmentId }, include: { course: true } });
  if (!assignment || assignment.course.status === "PUBLISHED") throw new Error("Assignment tidak ditemukan atau course sudah dipublikasikan.");
  return prisma.learningAssignment.update({ where: { id: assignmentId }, data: { isPublished: true } });
}
export async function submitAssignment(input: unknown) {
  const user = await requireLearningUser();
  const parsed = AssignmentSubmissionSchema.parse(input);
  const assignment = await prisma.learningAssignment.findUnique({ where: { id: parsed.assignmentId } });
  if (!assignment || !assignment.isPublished) throw new Error("Tugas tidak ditemukan atau belum diterbitkan.");
  const enrollment = await prisma.learningEnrollment.findFirst({
    where: { userId: user.id, courseId: assignment.courseId, status: { in: ["ACTIVE", "COMPLETED"] }, accessStartsAt: { lte: new Date() },
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }] },
  });
  if (!enrollment) throw new Error("Enrollment aktif tidak ditemukan.");
  if (assignment.lessonId) {
    const progress = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: assignment.lessonId } },
    });
    if (progress?.status !== "COMPLETED") throw new Error("Selesaikan lesson terkait sebelum mengumpulkan tugas.");
  }
  const dueAt = assignment.dueAfterDays ? new Date(enrollment.enrolledAt.getTime() + assignment.dueAfterDays * 86_400_000) : null;
  const late = dueAt !== null && new Date() > dueAt;
  if (late && !assignment.allowLateSubmission) throw new Error("Batas waktu pengumpulan tugas telah berakhir.");
  return prisma.learningAssignmentSubmission.create({
    data: {
      assignmentId: assignment.id, enrollmentId: enrollment.id, submittedByUserId: user.id,
      responseText: parsed.responseText, attachments: parsed.attachments as never, status: late ? "LATE" : "SUBMITTED",
    },
  });
}
export async function gradeAssignment(input: { submissionId: string; score: number; feedback: string }) {
  const reviewer = await requireLearningManager();
  if (!Number.isFinite(input.score) || input.score < 0) throw new Error("Nilai tidak valid.");
  if (!input.feedback.trim()) throw new Error("Feedback wajib diberikan.");
  const submission = await prisma.learningAssignmentSubmission.findUnique({ where: { id: input.submissionId }, include: { assignment: true } });
  if (!submission) throw new Error("Pengumpulan tugas tidak ditemukan.");
  if (input.score > Number(submission.assignment.maxScore)) throw new Error("Nilai melebihi nilai maksimum tugas.");
  return prisma.learningAssignmentSubmission.update({
    where: { id: submission.id },
    data: { score: input.score, feedback: input.feedback.trim(), status: "GRADED", reviewedAt: new Date(), reviewedByUserId: reviewer.id },
  });
}
export async function listPendingAssignmentSubmissions() {
  await requireLearningManager();
  return prisma.learningAssignmentSubmission.findMany({
    where: { status: { in: ["SUBMITTED", "LATE", "UNDER_REVIEW"] } }, orderBy: { submittedAt: "asc" },
    include: {
      assignment: { select: { id: true, title: true, maxScore: true, course: { select: { title: true } } } },
      enrollment: { select: { userId: true, course: { select: { title: true } } } },
    },
  });
}

export async function getMyAssignmentSubmissions(courseId?: string) {
  const user = await requireLearningUser();
  return prisma.learningAssignmentSubmission.findMany({
    where: {
      enrollment: { userId: user.id, ...(courseId ? { courseId } : {}) },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      assignment: { select: { id: true, title: true, maxScore: true, course: { select: { slug: true, title: true } } } },
    },
  });
}
