import { z } from "zod";

export const AssessmentQuestionTypeSchema = z.enum(["SINGLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING", "ORDERING"]);
export const AssessmentStageSchema = z.enum(["PRETEST", "POSTTEST", "CHAPTER_EXAM", "FINAL_EXAM"]);
export const AssessmentOptionInputSchema = z.object({
  optionKey: z.string().trim().min(1).max(40), label: z.string().trim().min(1).max(2_000),
  isCorrect: z.boolean().default(false), displayOrder: z.number().int().min(0).default(0),
});
export const AssessmentQuestionInputSchema = z.object({
  type: AssessmentQuestionTypeSchema, prompt: z.string().trim().min(1).max(10_000),
  explanation: z.string().max(10_000).optional(), points: z.number().positive().max(1_000).default(1),
  displayOrder: z.number().int().min(0).default(0), isRequired: z.boolean().default(true),
  options: z.array(AssessmentOptionInputSchema).default([]), correctAnswer: z.unknown().optional(),
  acceptedAnswers: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
  requiresManualReview: z.boolean().default(false),
}).superRefine((q, ctx) => {
  if (["SINGLE_CHOICE", "TRUE_FALSE"].includes(q.type)) {
    if (q.options.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Minimal dua opsi diperlukan.", path: ["options"] });
    if (q.options.filter((o) => o.isCorrect).length !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tepat satu opsi harus benar.", path: ["options"] });
  }
  if (q.type === "MULTIPLE_SELECT" && q.options.filter((o) => o.isCorrect).length < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Minimal satu opsi benar.", path: ["options"] });
  if (q.type === "SHORT_ANSWER" && q.acceptedAnswers.length === 0 && !q.requiresManualReview) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Kunci jawaban atau review manual diperlukan.", path: ["acceptedAnswers"] });
  if (["MATCHING", "ORDERING"].includes(q.type) && q.correctAnswer === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctAnswer wajib untuk tipe ini.", path: ["correctAnswer"] });
});
export const AssessmentPolicySchema = z.object({
  passingScore: z.number().min(0).max(100).default(70), maxAttempts: z.number().int().positive().nullable().default(null),
  timeLimitSeconds: z.number().int().positive().nullable().default(null), retryCooldownSeconds: z.number().int().min(0).default(0),
  shuffleQuestions: z.boolean().default(false), shuffleOptions: z.boolean().default(false),
  showExplanation: z.boolean().default(true), allowReview: z.boolean().default(true), isRequired: z.boolean().default(true),
});
export const CreateAssessmentSchema = z.object({
  courseId: z.string().uuid(), chapterId: z.string().uuid().optional(), lessonId: z.string().uuid().optional(),
  stage: AssessmentStageSchema, title: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).optional(), instructions: z.string().max(10_000).optional(),
  policy: AssessmentPolicySchema, questions: z.array(AssessmentQuestionInputSchema).min(1).max(500),
}).superRefine((a, ctx) => {
  if (a.stage === "CHAPTER_EXAM" && !a.chapterId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chapter exam harus terhubung ke chapter.", path: ["chapterId"] });
  if (a.stage === "POSTTEST" && !a.lessonId && !a.chapterId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Posttest harus terhubung ke lesson atau chapter.", path: ["lessonId"] });
  if (a.stage === "FINAL_EXAM" && (a.chapterId || a.lessonId)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Final exam terhubung ke course.", path: ["stage"] });
});
export const SubmitAssessmentAttemptSchema = z.object({
  answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.unknown() })).max(500),
}).superRefine((v, ctx) => {
  const ids = v.answers.map((a) => a.questionId);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplikasi jawaban soal tidak diizinkan.", path: ["answers"] });
});
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type AssessmentQuestionInput = z.infer<typeof AssessmentQuestionInputSchema>;
