import { z } from "zod";

const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const CourseAuthoringSchema = z.object({
  catalogItemId: z.string().min(1).max(100), slug, title: z.string().trim().min(3).max(200),
  shortDescription: z.string().max(500).optional(), description: z.string().trim().min(1).max(20_000),
  status: z.enum(["DRAFT", "COMING_SOON", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  enrollmentMode: z.enum(["PAID", "INVITE_ONLY", "OPEN"]).default("PAID"),
  language: z.string().trim().min(2).max(12).default("id"),
  level: z.string().trim().max(80).optional(),
  estimatedDurationMinutes: z.number().int().positive().max(100_000).optional(),
  accessDurationDays: z.number().int().positive().max(3_650).nullable().default(null),
  learningOutcomes: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  prerequisites: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  certificateEnabled: z.boolean().default(true),
  certificatePolicy: z.object({
    finalExamRequired: z.boolean().default(true), finalExamPassingScore: z.number().min(0).max(100).default(70),
    minimumProgressPercentage: z.number().min(0).max(100).default(100), requiredAssignments: z.boolean().default(false),
  }).default({ finalExamRequired: true, finalExamPassingScore: 70, minimumProgressPercentage: 100, requiredAssignments: false }),
});
export const ChapterAuthoringSchema = z.object({
  courseId: z.string().uuid(), title: z.string().trim().min(1).max(200), slug,
  description: z.string().max(10_000).optional(), displayOrder: z.number().int().min(0),
  isRequired: z.boolean().default(true), isPublished: z.boolean().default(false),
  gatePolicy: z.object({
    pretestRequiredBeforeLessons: z.boolean().default(false),
    requireAllLessonsCompleted: z.boolean().default(true),
    requireChapterExamPassed: z.boolean().default(true),
  }).default({ pretestRequiredBeforeLessons: false, requireAllLessonsCompleted: true, requireChapterExamPassed: true }),
});
export const LessonAuthoringSchema = z.object({
  chapterId: z.string().uuid(), title: z.string().trim().min(1).max(200), slug,
  description: z.string().max(10_000).optional(), displayOrder: z.number().int().min(0),
  estimatedDurationMinutes: z.number().int().positive().max(10_000).optional(),
  isRequired: z.boolean().default(true), isPublished: z.boolean().default(false),
});
export const LessonContentBlockSchema = z.object({
  lessonId: z.string().uuid(),
  type: z.enum(["TEXT", "VIDEO", "IMAGE", "FILE", "CODE", "EMBED", "LINK", "PRACTICE"]),
  title: z.string().max(200).optional(), body: z.string().max(100_000).optional(),
  resourceUrl: z.string().url().max(2_000).optional(), storageKey: z.string().max(500).optional(),
  codeLanguage: z.string().max(40).optional(), metadata: z.record(z.string(), z.unknown()).optional(),
  displayOrder: z.number().int().min(0), isRequired: z.boolean().default(false),
}).superRefine((block, ctx) => {
  if (block.type === "TEXT" && !block.body) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Isi teks wajib diisi.", path: ["body"] });
  if (["VIDEO", "IMAGE", "FILE", "EMBED", "LINK"].includes(block.type) && !block.resourceUrl && !block.storageKey) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Referensi media wajib diisi.", path: ["resourceUrl"] });
  }
  if (block.type === "FILE" && block.resourceUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "File privat harus memakai storageKey agar entitlement bisa diperiksa.", path: ["resourceUrl"] });
  }
  if (block.type === "CODE" && !block.body) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Source code wajib diisi.", path: ["body"] });
});
export const LessonProgressActionSchema = z.object({ lessonId: z.string().uuid(), action: z.enum(["START", "COMPLETE"]) });
export const AssignmentSubmissionSchema = z.object({
  assignmentId: z.string().uuid(), responseText: z.string().max(30_000).optional(),
  attachments: z.array(z.object({
    storageKey: z.string().min(1).max(500), fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120), sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
  })).max(10).default([]),
}).refine((value) => Boolean(value.responseText?.trim()) || value.attachments.length > 0, {
  message: "Jawaban atau lampiran wajib diisi sebelum mengirim tugas.",
});
export type CourseAuthoringInput = z.infer<typeof CourseAuthoringSchema>;
export type ChapterAuthoringInput = z.infer<typeof ChapterAuthoringSchema>;
export type LessonAuthoringInput = z.infer<typeof LessonAuthoringSchema>;
export type LessonContentBlockInput = z.infer<typeof LessonContentBlockSchema>;
export type AssignmentSubmissionInput = z.infer<typeof AssignmentSubmissionSchema>;
