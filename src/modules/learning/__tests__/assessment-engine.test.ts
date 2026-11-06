import { describe, expect, it } from "vitest";
import {
  attemptDeadline, evaluateAttemptAvailability, isAttemptExpired, scoreAssessment, shuffle,
  type QuestionDefinition,
} from "../services/assessment-engine";

const questions: QuestionDefinition[] = [
  { id: "q1", type: "SINGLE_CHOICE", points: 2, correctOptionIds: ["a"] },
  { id: "q2", type: "MULTIPLE_SELECT", points: 2, correctOptionIds: ["x", "y"] },
  { id: "q3", type: "SHORT_ANSWER", points: 1, acceptedAnswers: ["Microsoft Excel"] },
  { id: "q4", type: "TRUE_FALSE", points: 1, correctOptionIds: ["true-option"] },
];

describe("assessment scoring", () => {
  it("grades objective and normalized short answers with server-held keys", () => {
    const result = scoreAssessment(questions, [
      { questionId: "q1", answer: "a" },
      { questionId: "q2", answer: ["y", "x"] },
      { questionId: "q3", answer: "  microsoft   excel " },
      { questionId: "q4", answer: "true-option" },
    ], 70);
    expect(result.earnedPoints).toBe(6);
    expect(result.maxPoints).toBe(6);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("requires exact selected-set matching for multiple select", () => {
    const result = scoreAssessment(questions, [
      { questionId: "q1", answer: "a" },
      { questionId: "q2", answer: ["x"] },
      { questionId: "q3", answer: "Microsoft Excel" },
      { questionId: "q4", answer: "true-option" },
    ], 70);
    expect(result.questionResults[1].isCorrect).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("scores an unanswered required question as zero", () => {
    const result = scoreAssessment([
      { id: "essay", type: "SHORT_ANSWER", points: 10, requiresManualReview: true },
    ], [], 70);
    expect(result.pendingReview).toBe(false);
    expect(result.questionResults[0].isCorrect).toBe(false);
  });

  it("keeps submitted free-response answers pending manual review", () => {
    const result = scoreAssessment([
      { id: "essay", type: "SHORT_ANSWER", points: 10, requiresManualReview: true },
    ], [{ questionId: "essay", answer: "Penjelasan peserta" }], 70);
    expect(result.pendingReview).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("ignores optional questions in the passing score", () => {
    const result = scoreAssessment([
      { id: "required", type: "SINGLE_CHOICE", points: 1, correctOptionIds: ["yes"] },
      { id: "optional", type: "SINGLE_CHOICE", points: 100, correctOptionIds: ["x"], isRequired: false },
    ], [{ questionId: "required", answer: "yes" }], 100);
    expect(result.maxPoints).toBe(1);
    expect(result.passed).toBe(true);
  });

  it("shuffles without mutating the source list", () => {
    const source = [1, 2, 3, 4];
    const shuffled = shuffle(source, () => 0);
    expect(source).toEqual([1, 2, 3, 4]);
    expect(shuffled).toHaveLength(4);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4]);
  });
});

describe("attempt policy", () => {
  const policy = { maxAttempts: 2, retryCooldownSeconds: 60 };
  it("blocks after the configured attempt limit", () => {
    expect(evaluateAttemptAvailability({ policy, attemptCount: 2, lastFinishedAt: null }).reason).toBe("ATTEMPT_LIMIT_REACHED");
  });
  it("blocks a second active attempt", () => {
    expect(evaluateAttemptAvailability({ policy, attemptCount: 1, activeAttempt: true, lastFinishedAt: null }).reason).toBe("ACTIVE_ATTEMPT");
  });
  it("enforces cooldown using server time", () => {
    const result = evaluateAttemptAvailability({
      policy, attemptCount: 1, lastFinishedAt: new Date("2026-01-01T00:00:00.000Z"),
      now: new Date("2026-01-01T00:00:30.000Z"),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("COOLDOWN");
    expect(result.cooldownUntil?.toISOString()).toBe("2026-01-01T00:01:00.000Z");
  });
  it("calculates deadline and detects expiry from the server timestamp", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z");
    const deadline = attemptDeadline(startedAt, 90);
    expect(deadline?.toISOString()).toBe("2026-01-01T00:01:30.000Z");
    expect(isAttemptExpired(deadline, new Date("2026-01-01T00:02:00.000Z"))).toBe(true);
  });
});
