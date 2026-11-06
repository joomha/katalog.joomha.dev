import { describe, expect, it } from "vitest";
import {
  canAccessChapter, canStartChapterExam, canStartFinalExam,
  certificateEligibility, chapterComplete, type ChapterGateState,
} from "../services/progression.service";

function chapter(id: string, overrides: Partial<ChapterGateState> = {}): ChapterGateState {
  return {
    id, required: true, published: true, pretestRequired: false, pretestPassed: false,
    allLessonsRequired: true, examRequired: true, examPassed: false,
    lessons: [{
      id: id + "-lesson", required: true, completed: false,
      posttestRequired: true, posttestPassed: false,
      gameRequired: false, gamesCompleted: false,
      assignmentRequired: false, assignmentSubmitted: false,
    }],
    ...overrides,
  };
}
const completedLesson = {
  id: "lesson-1", required: true, completed: true,
  posttestRequired: true, posttestPassed: true,
  gameRequired: true, gamesCompleted: true,
  assignmentRequired: true, assignmentSubmitted: true,
};

describe("chapter progression", () => {
  it("opens the first published chapter without previous requirements", () => {
    expect(canAccessChapter(0, [chapter("ch-1")]).allowed).toBe(true);
  });
  it("keeps the next chapter locked until the previous gate passes", () => {
    const result = canAccessChapter(1, [chapter("ch-1"), chapter("ch-2")]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("PREVIOUS_CHAPTER_INCOMPLETE");
  });
  it("requires the optional pretest only when explicitly configured", () => {
    const target = chapter("ch-1", { pretestRequired: true, pretestPassed: false });
    expect(canAccessChapter(0, [target]).allowed).toBe(true);
    expect(canStartChapterExam(target).reason).toBe("PRETEST_REQUIRED");
  });
  it("requires lessons, posttest, games and assignment before chapter exam", () => {
    const target = chapter("ch-1", { lessons: [completedLesson] });
    expect(canStartChapterExam(target).allowed).toBe(true);
    expect(chapterComplete({ ...target, examPassed: true })).toBe(true);
    expect(canStartChapterExam(chapter("ch-1")).allowed).toBe(false);
  });
  it("keeps final exam locked until every required chapter is complete", () => {
    const incomplete = chapter("ch-1", { lessons: [completedLesson], examPassed: false });
    expect(canStartFinalExam([incomplete]).allowed).toBe(false);
    const complete = { ...incomplete, examPassed: true };
    expect(canStartFinalExam([complete]).allowed).toBe(true);
  });
  it("checks final exam, required assignments and progress for certificate eligibility", () => {
    const complete = chapter("ch-1", { lessons: [completedLesson], examPassed: true });
    const base = {
      chapters: [complete], finalExamRequired: true, finalExamPassed: false,
      assignmentsComplete: true, requiredLessonsComplete: 1, requiredLessonsTotal: 1, minimumProgress: 100,
    };
    expect(certificateEligibility(base).reason).toBe("FINAL_EXAM_REQUIRED");
    expect(certificateEligibility({ ...base, finalExamPassed: true, assignmentsComplete: false }).reason).toBe("ASSIGNMENT_REQUIRED");
    expect(certificateEligibility({ ...base, finalExamPassed: true, requiredLessonsComplete: 0 }).reason).toBe("MINIMUM_PROGRESS_NOT_MET");
    expect(certificateEligibility({ ...base, finalExamPassed: true }).allowed).toBe(true);
  });
});
