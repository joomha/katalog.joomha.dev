export type LearningCourseStatus = "DRAFT" | "COMING_SOON" | "PUBLISHED" | "ARCHIVED";
export type CourseEnrollmentMode = "PAID" | "INVITE_ONLY" | "OPEN";
export type AssessmentStage = "PRETEST" | "POSTTEST" | "CHAPTER_EXAM" | "FINAL_EXAM";
export type AssessmentQuestionType = "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING" | "ORDERING";
export type LearningGameType = "CROSSWORD" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MATCHING_PAIRS" | "WORD_SCRAMBLE" | "FILL_IN_THE_BLANK" | "FLASHCARDS" | "ORDERING" | "TIMED_CHALLENGE";

export interface CourseSummary {
  id: string; catalogItemId: string; slug: string; title: string;
  shortDescription: string | null; description: string; status: LearningCourseStatus;
  level: string | null; estimatedDurationMinutes: number | null;
  chapterCount: number; lessonCount: number; learningOutcomes: string[];
}
export interface CoursePlayerLesson {
  id: string; slug: string; title: string; description: string | null;
  displayOrder: number; isRequired: boolean; isCompleted: boolean; isUnlocked: boolean;
  contentBlocks: Array<{
    id: string; type: string; title: string | null; body: string | null;
    resourceUrl: string | null; codeLanguage: string | null; displayOrder: number;
  }>;
}
export interface CoursePlayerChapter {
  id: string; title: string; slug: string; displayOrder: number;
  isUnlocked: boolean; isComplete: boolean; lessons: CoursePlayerLesson[];
}
