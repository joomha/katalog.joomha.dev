export interface LessonGateState {
  id: string; required: boolean; completed: boolean;
  posttestRequired: boolean; posttestPassed: boolean;
  gameRequired: boolean; gamesCompleted: boolean;
  assignmentRequired: boolean; assignmentSubmitted: boolean;
}
export interface ChapterGateState {
  id: string; required: boolean; published: boolean;
  pretestRequired: boolean; pretestPassed: boolean;
  allLessonsRequired: boolean; examRequired: boolean; examPassed: boolean;
  lessons: LessonGateState[];
}
export interface CourseCertificateRequirements {
  finalExamRequired: boolean; finalExamPassed: boolean; assignmentsComplete: boolean;
  requiredLessonsComplete: number; requiredLessonsTotal: number; minimumProgress: number;
}
export type GateReason =
  | "AVAILABLE" | "CHAPTER_NOT_PUBLISHED" | "PREVIOUS_CHAPTER_INCOMPLETE" | "PRETEST_REQUIRED"
  | "LESSONS_INCOMPLETE" | "POSTTEST_REQUIRED" | "GAME_REQUIRED" | "ASSIGNMENT_REQUIRED"
  | "CHAPTER_EXAM_REQUIRED" | "COURSE_PREREQUISITES_INCOMPLETE" | "FINAL_EXAM_REQUIRED" | "MINIMUM_PROGRESS_NOT_MET";
export interface GateResult { allowed: boolean; reason: GateReason; blockingIds: string[]; }

export function lessonGateComplete(lesson: LessonGateState, requireCompletion = true): boolean {
  if (!lesson.required) return true;
  return (!requireCompletion || lesson.completed)
    && (!lesson.posttestRequired || lesson.posttestPassed)
    && (!lesson.gameRequired || lesson.gamesCompleted)
    && (!lesson.assignmentRequired || lesson.assignmentSubmitted);
}
export function canStartLessons(chapter: ChapterGateState): GateResult {
  if (!chapter.published) return { allowed: false, reason: "CHAPTER_NOT_PUBLISHED", blockingIds: [chapter.id] };
  if (chapter.pretestRequired && !chapter.pretestPassed) {
    return { allowed: false, reason: "PRETEST_REQUIRED", blockingIds: [chapter.id] };
  }
  return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function chapterComplete(chapter: ChapterGateState): boolean {
  if (!chapter.required) return true;
  if (!chapter.published || !canStartLessons(chapter).allowed) return false;
  if (chapter.examRequired && !chapter.examPassed) return false;
  return chapter.lessons.every((lesson) => lessonGateComplete(lesson, chapter.allLessonsRequired));
}
export function canAccessChapter(targetIndex: number, chapters: readonly ChapterGateState[]): GateResult {
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= chapters.length) {
    return { allowed: false, reason: "CHAPTER_NOT_PUBLISHED", blockingIds: [] };
  }
  const target = chapters[targetIndex];
  if (!target.published) return { allowed: false, reason: "CHAPTER_NOT_PUBLISHED", blockingIds: [target.id] };
  for (const chapter of chapters.slice(0, targetIndex)) {
    if (chapter.required && !chapterComplete(chapter)) {
      return { allowed: false, reason: "PREVIOUS_CHAPTER_INCOMPLETE", blockingIds: [chapter.id] };
    }
  }
  // The target chapter may remain accessible for its required pretest.
  return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function canStartChapterExam(chapter: ChapterGateState): GateResult {
  const lessonGate = canStartLessons(chapter);
  if (!lessonGate.allowed) return lessonGate;
  const blockers = chapter.lessons.filter((lesson) => lesson.required && !lessonGateComplete(lesson, chapter.allLessonsRequired));
  if (blockers.length) {
    const posttest = blockers.some((lesson) => lesson.posttestRequired && !lesson.posttestPassed);
    const game = blockers.some((lesson) => lesson.gameRequired && !lesson.gamesCompleted);
    const assignment = blockers.some((lesson) => lesson.assignmentRequired && !lesson.assignmentSubmitted);
    return {
      allowed: false,
      reason: posttest ? "POSTTEST_REQUIRED" : game ? "GAME_REQUIRED" : assignment ? "ASSIGNMENT_REQUIRED" : "LESSONS_INCOMPLETE",
      blockingIds: blockers.map((lesson) => lesson.id),
    };
  }
  if (chapter.examRequired && !chapter.examPassed) return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
  return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function canStartFinalExam(chapters: readonly ChapterGateState[]): GateResult {
  const incomplete = chapters.filter((chapter) => chapter.required && !chapterComplete(chapter)).map((chapter) => chapter.id);
  return incomplete.length
    ? { allowed: false, reason: "COURSE_PREREQUISITES_INCOMPLETE", blockingIds: incomplete }
    : { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function certificateEligibility(input: { chapters: readonly ChapterGateState[] } & CourseCertificateRequirements): GateResult {
  const chapterGate = canStartFinalExam(input.chapters);
  if (!chapterGate.allowed) return chapterGate;
  const progress = input.requiredLessonsTotal === 0 ? 100 : input.requiredLessonsComplete / input.requiredLessonsTotal * 100;
  if (progress < input.minimumProgress) return { allowed: false, reason: "MINIMUM_PROGRESS_NOT_MET", blockingIds: [] };
  if (!input.assignmentsComplete) return { allowed: false, reason: "ASSIGNMENT_REQUIRED", blockingIds: [] };
  if (input.finalExamRequired && !input.finalExamPassed) return { allowed: false, reason: "FINAL_EXAM_REQUIRED", blockingIds: [] };
  return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
