import { describe, expect, it } from "vitest";
import { AssignmentSubmissionSchema, LessonContentBlockSchema } from "../schemas/course.schema";

const lessonId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
describe("lesson content block validation", () => {
  it("requires text body for text blocks", () => {
    expect(LessonContentBlockSchema.safeParse({ lessonId, type: "TEXT", displayOrder: 0 }).success).toBe(false);
  });
  it("accepts code blocks with a source body", () => {
    expect(LessonContentBlockSchema.safeParse({ lessonId, type: "CODE", body: "const total = 1 + 1;", codeLanguage: "typescript", displayOrder: 0 }).success).toBe(true);
  });
  it("requires file and video reference metadata", () => {
    expect(LessonContentBlockSchema.safeParse({ lessonId, type: "VIDEO", displayOrder: 0 }).success).toBe(false);
  });
});
describe("assignment submissions", () => {
  it("requires response text or at least one attachment", () => {
    expect(AssignmentSubmissionSchema.safeParse({ assignmentId: lessonId }).success).toBe(false);
    expect(AssignmentSubmissionSchema.safeParse({ assignmentId: lessonId, responseText: "Laporan selesai" }).success).toBe(true);
  });
  it("validates private attachment metadata and caps file size", () => {
    expect(AssignmentSubmissionSchema.safeParse({
      assignmentId: lessonId,
      attachments: [{ storageKey: "private/user/file", fileName: "hasil.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 1024 }],
    }).success).toBe(true);
    expect(AssignmentSubmissionSchema.safeParse({
      assignmentId: lessonId, attachments: [{ storageKey: "private/file", fileName: "large.zip", contentType: "application/zip", sizeBytes: 26 * 1024 * 1024 }],
    }).success).toBe(false);
  });
});
