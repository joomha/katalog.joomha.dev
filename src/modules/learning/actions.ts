"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { UnauthenticatedError } from "@/modules/identity/types";
import {
  createChapter, publishChapter, createCourse, createLesson, publishLesson,
  createLessonContentBlock, publishCourse, markContentBlockViewed,
  markLessonCompleted, markLessonStarted, createAssessment, publishAssessment,
  createLearningGame, publishLearningGame, createAssignment, publishAssignment,
  enrollCurrentUserInOpenCourse, startAssessmentAttempt, saveAssessmentAttemptDraft,
  submitAssessmentAttempt, startGameAttempt, submitGameAttempt, submitAssignment,
  gradeAssignment, completeCourseEnrollment, issueCertificateManually, revokeCertificate,
} from "./services";

function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error("Field " + key + " wajib diisi.");
  return value.trim();
}
function optional(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function jsonField(formData: FormData, key: string): unknown {
  try { return JSON.parse(required(formData, key)) as unknown; }
  catch { throw new Error("Field " + key + " harus berisi JSON valid."); }
}

export async function createCourseAction(formData: FormData) {
  const catalogItemId = required(formData, "catalogItemId");
  const catalog = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!catalog || catalog.type !== "SELF_PACED_COURSE") throw new Error("Listing kursus katalog tidak ditemukan.");
  const course = await createCourse({
    catalogItemId, slug: catalog.slug, title: optional(formData, "title") ?? catalog.title,
    shortDescription: catalog.shortDescription, description: optional(formData, "description") ?? catalog.description,
    status: "DRAFT", enrollmentMode: "PAID", language: "id", certificateEnabled: true,
  });
  revalidatePath("/admin/pembelajaran");
  redirect("/admin/pembelajaran/" + course.slug);
}
export async function createChapterAction(formData: FormData) {
  const slug = required(formData, "courseSlug");
  await createChapter({
    courseId: required(formData, "courseId"), title: required(formData, "title"), slug: required(formData, "slug"),
    description: optional(formData, "description"), displayOrder: Number(formData.get("displayOrder") ?? 0),
    isRequired: true, isPublished: false,
    gatePolicy: { pretestRequiredBeforeLessons: formData.get("pretestRequired") === "on", requireAllLessonsCompleted: true, requireChapterExamPassed: true },
  });
  revalidatePath("/admin/pembelajaran/" + slug);
}
export async function publishChapterAction(formData: FormData) {
  await publishChapter(required(formData, "chapterId"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function createLessonAction(formData: FormData) {
  await createLesson({
    chapterId: required(formData, "chapterId"), title: required(formData, "title"), slug: required(formData, "slug"),
    description: optional(formData, "description"), displayOrder: Number(formData.get("displayOrder") ?? 0),
    isRequired: true, isPublished: false,
  });
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function publishLessonAction(formData: FormData) {
  await publishLesson(required(formData, "lessonId"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function createTextContentAction(formData: FormData) {
  await createLessonContentBlock({
    lessonId: required(formData, "lessonId"), type: "TEXT", title: required(formData, "title"),
    body: required(formData, "body"), displayOrder: Number(formData.get("displayOrder") ?? 0), isRequired: true,
  });
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function createAssessmentJsonAction(formData: FormData) {
  await createAssessment(jsonField(formData, "assessmentJson"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));

}
export async function publishAssessmentAction(formData: FormData) {
  await publishAssessment(required(formData, "assessmentId"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function createGameJsonAction(formData: FormData) {
  await createLearningGame(jsonField(formData, "gameJson"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));

}
export async function publishGameAction(formData: FormData) {
  await publishLearningGame(required(formData, "gameId"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function createAssignmentJsonAction(formData: FormData) {
  await createAssignment(jsonField(formData, "assignmentJson"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));

}
export async function publishAssignmentAction(formData: FormData) {
  await publishAssignment(required(formData, "assignmentId"));
  revalidatePath("/admin/pembelajaran/" + required(formData, "courseSlug"));
}
export async function publishCourseAction(formData: FormData) {
  const course = await publishCourse(required(formData, "courseId"));
  revalidatePath("/admin/pembelajaran");
  revalidatePath("/kursus");
  revalidatePath("/kursus/" + course.slug);
}
export async function markContentBlockViewedAction(formData: FormData) {
  await markContentBlockViewed(required(formData, "contentBlockId"));
  revalidatePath("/akun/pembelajaran");
}
export async function markLessonStartedAction(formData: FormData) {
  await markLessonStarted(required(formData, "lessonId"));
  revalidatePath("/akun/pembelajaran");
}
export async function markLessonCompletedAction(formData: FormData) {
  await markLessonCompleted(required(formData, "lessonId"));
  revalidatePath("/akun/pembelajaran");
}
export async function enrollOpenCourseAction(formData: FormData) {
  const slug = required(formData, "slug");
  try {
    await enrollCurrentUserInOpenCourse(required(formData, "courseId"));
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/masuk?callbackUrl=" + encodeURIComponent("/kursus/" + slug));
    throw error;
  }
  revalidatePath("/akun/pembelajaran");
  redirect("/akun/pembelajaran/" + slug);
}
export async function startAssessmentAttemptAction(assessmentId: string) {
  return startAssessmentAttempt(assessmentId);
}
export async function saveAssessmentAttemptDraftAction(attemptId: string, answers: Array<{ questionId: string; answer: unknown }>) {
  return saveAssessmentAttemptDraft(attemptId, answers);
}
export async function submitAssessmentAttemptAction(attemptId: string, answers: Array<{ questionId: string; answer: unknown }>) {
  return submitAssessmentAttempt(attemptId, { answers });
}
export async function startGameAttemptAction(gameId: string) {
  return startGameAttempt(gameId);
}
export async function submitGameAttemptAction(attemptId: string, input: { answers: Record<string, unknown> }) {
  return submitGameAttempt(attemptId, input);
}
export async function submitAssignmentAction(formData: FormData) {
  await submitAssignment({
    assignmentId: required(formData, "assignmentId"), responseText: optional(formData, "responseText"),
    attachments: [],
  });
  revalidatePath("/akun/pembelajaran");
}
export async function gradeAssignmentAction(formData: FormData) {
  await gradeAssignment({
    submissionId: required(formData, "submissionId"), score: Number(required(formData, "score")),
    feedback: required(formData, "feedback"),
  });
  revalidatePath("/admin/pembelajaran/tugas");
}
export async function completeCourseAction(formData: FormData) {
  await completeCourseEnrollment(required(formData, "courseId"));
  revalidatePath("/akun/pembelajaran");
  revalidatePath("/akun/sertifikat");
}
export async function issueCertificateAction(formData: FormData) {
  await issueCertificateManually(required(formData, "enrollmentId"), process.env.AUTH_URL ?? "http://localhost:3000");
  revalidatePath("/admin/pembelajaran");
}
export async function revokeCertificateAction(formData: FormData) {
  await revokeCertificate(required(formData, "certificateId"), required(formData, "reason"));
  revalidatePath("/admin/pembelajaran");
}
