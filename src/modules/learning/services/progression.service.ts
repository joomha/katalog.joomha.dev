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
export interface GateResult {
  allowed: boolean;
  reason: "AVAILABLE" | "CHAPTER_LOCKED" | "PRETEST_REQUIRED" | "LESSONS_INCOMPLETE" | "POSTTEST_REQUIRED" | "GAME_REQUIRED" | "ASSIGNMENT_REQUIRED" | "CHAPTER_EXAM_REQUIRED" | "COURSE_PREREQUISITES_INCOMPLETE" | "FINAL_EXAM_REQUIRED" | "PROGRESS_REQUIRED";
  blockingIds: string[];
}
export function chapterLessonsComplete(c: ChapterGateState): boolean {
  if (!c.published || (c.pretestRequired && !c.pretestPassed)) return false;
  const required = c.lessons.filter((l) => l.required);
  if (c.allLessonsRequired && required.some((l) => !l.completed)) return false;
  if (required.some((l) => l.posttestRequired && !l.posttestPassed)) return false;
  if (required.some((l) => l.gameRequired && !l.gamesCompleted)) return false;
  if (required.some((l) => l.assignmentRequired && !l.assignmentSubmitted)) return false;
  return true;
}
export function chapterComplete(c: ChapterGateState): boolean {
  return !c.required || (chapterLessonsComplete(c) && (!c.examRequired || c.examPassed));
}
export function canAccessChapter(index: number, chapters: readonly ChapterGateState[]): GateResult {
  if (!Number.isInteger(index) || index < 0 || index >= chapters.length || !chapters[index].published) {
    return { allowed: false, reason: "CHAPTER_LOCKED", blockingIds: index >= 0 && index < chapters.length ? [chapters[index].id] : [] };
  }
  const blockers = chapters.slice(0, index).filter((c) => c.required && !chapterComplete(c)).map((c) => c.id);
  return blockers.length ? { allowed: false, reason: "CHAPTER_LOCKED", blockingIds: blockers } : { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function canStartChapterExam(c: ChapterGateState): GateResult {
  if (c.pretestRequired && !c.pretestPassed) return { allowed: false, reason: "PRETEST_REQUIRED", blockingIds: [c.id] };
  if (!chapterLessonsComplete(c)) {
    const missing = c.lessons.filter((l) => l.required && ((c.allLessonsRequired && !l.completed) || (l.posttestRequired && !l.posttestPassed) || (l.gameRequired && !l.gamesCompleted) || (l.assignmentRequired && !l.assignmentSubmitted))).map((l) => l.id);
    const reason = c.lessons.some((l) => l.required && l.posttestRequired && !l.posttestPassed) ? "POSTTEST_REQUIRED"
      : c.lessons.some((l) => l.required && l.gameRequired && !l.gamesCompleted) ? "GAME_REQUIRED"
      : c.lessons.some((l) => l.required && l.assignmentRequired && !l.assignmentSubmitted) ? "ASSIGNMENT_REQUIRED" : "LESSONS_INCOMPLETE";
    return { allowed: false, reason, blockingIds: missing };
  }
  return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function canStartFinalExam(chapters: readonly ChapterGateState[]): GateResult {
  const blockers = chapters.filter((c) => c.required && !chapterComplete(c)).map((c) => c.id);
  return blockers.length ? { allowed: false, reason: "COURSE_PREREQUISITES_INCOMPLETE", blockingIds: blockers } : { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
export function certificateEligibility(input: {
  chapters: readonly ChapterGateState[]; finalExamRequired: boolean; finalExamPassed: boolean;
  assignmentsComplete: boolean; requiredLessonsComplete: number; requiredLessonsTotal: number; minimumProgress: number;
}): GateResult {
  const chaptersGate = canStartFinalExam(input.chapters);
  if (!chaptersGate.allowed) return chaptersGate;
  const progress = input.requiredLessonsTotal === 0 ? 100 : input.requiredLessonsComplete / input.requiredLessonsTotal * 100;
  if (progress < input.minimumProgress) return { allowed: false, reason: "PROGRESS_REQUIRED", blockingIds: [] };
  if (!input.assignmentsComplete) return { allowed: false, reason: "ASSIGNMENT_REQUIRED", blockingIds: [] };
  if (input.finalExamRequired && !input.finalExamPassed) return { allowed: false, reason: "FINAL_EXAM_REQUIRED", blockingIds: [] };
  return { allowed: true, reason: "AVAILABLE", blockingIds: [] };
}
