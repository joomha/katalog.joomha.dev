import { describe, expect, it } from "vitest";
import { scoreAssessment, shuffle, type QuestionDefinition } from "../services/assessment-engine";
const questions: QuestionDefinition[] = [
  { id: "q1", type: "SINGLE_CHOICE", points: 2, correctOptionIds: ["A"] },
  { id: "q2", type: "MULTIPLE_SELECT", points: 2, correctOptionIds: ["X", "Y"] },
  { id: "q3", type: "SHORT_ANSWER", points: 1, acceptedAnswers: ["Microsoft Excel"] },
];
describe("assessment engine", () => {
  it("grades single choice, exact multiple-select sets and normalized short answers", () => {
    const result = scoreAssessment(questions, [
      { questionId: "q1", answer: "A" }, { questionId: "q2", answer: ["Y", "X"] }, { questionId: "q3", answer: " microsoft   excel " },
    ], 70);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
  });
  it("does not award points for omitted or partially selected answers", () => {
    const result = scoreAssessment(questions, [{ questionId: "q1", answer: "A" }, { questionId: "q2", answer: ["X"] }], 70);
    expect(result.earnedPoints).toBe(2);
    expect(result.passed).toBe(false);
  });
  it("requires manual review for submitted essay answers", () => {
    const result = scoreAssessment([{ id: "essay", type: "SHORT_ANSWER", points: 10, requiresManualReview: true }], [{ questionId: "essay", answer: "Jawaban" }], 70);
    expect(result.pendingReview).toBe(true);
    expect(result.passed).toBe(false);
  });
  it("shuffles a copy rather than mutating the source collection", () => {
    const source = [1, 2, 3];
    shuffle(source, () => 0);
    expect(source).toEqual([1, 2, 3]);
  });
});
