import { describe, expect, it } from "vitest";
import { canAccessChapter, canStartChapterExam, canStartFinalExam, chapterComplete, type ChapterGateState } from "../services/progression.service";
function chapter(id: string, overrides: Partial<ChapterGateState> = {}): ChapterGateState {
  return {
    id, required: true, published: true, pretestRequired: false, pretestPassed: false,
    allLessonsRequired: true, examRequired: true, examPassed: false,
    lessons: [{ id: id + "-lesson", required: true, completed: false, posttestRequired: false, posttestPassed: false, gameRequired: false, gamesCompleted: false, assignmentRequired: false, assignmentSubmitted: false }],
    ...overrides,
  };
}
describe("progression gates", () => {
  it("allows first published chapter and locks later chapters", () => {
    expect(canAccessChapter(0, [chapter("one"), chapter("two")]).allowed).toBe(true);
    expect(canAccessChapter(1, [chapter("one"), chapter("two")]).reason).toBe("CHAPTER_LOCKED");
  });
  it("requires chapter lesson requirements before the chapter exam", () => {
    expect(canStartChapterExam(chapter("one")).allowed).toBe(false);
    const complete = chapter("one", { lessons: [{ id: "l1", required: true, completed: true, posttestRequired: false, posttestPassed: false, gameRequired: false, gamesCompleted: false, assignmentRequired: false, assignmentSubmitted: false }] });
    expect(canStartChapterExam(complete).allowed).toBe(true);
    expect(chapterComplete(complete)).toBe(false);
  });
  it("requires all chapter exams before final exam", () => {
    expect(canStartFinalExam([chapter("one")]).allowed).toBe(false);
  });
});
