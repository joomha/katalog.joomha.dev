export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING" | "ORDERING";
export interface QuestionDefinition {
  id: string; type: QuestionType; points: number; correctOptionIds?: string[];
  acceptedAnswers?: string[]; correctAnswer?: unknown; requiresManualReview?: boolean; isRequired?: boolean;
}
export type AssessmentQuestionDefinition = QuestionDefinition;
export interface AnswerInput { questionId: string; answer: unknown; }
export interface QuestionResult { questionId: string; isCorrect: boolean | null; pointsEarned: number; maxPoints: number; needsReview: boolean; }
export interface AssessmentResult { earnedPoints: number; maxPoints: number; percentage: number; passed: boolean; pendingReview: boolean; questionResults: QuestionResult[]; }
export interface AttemptPolicy {
  maxAttempts: number | null; retryCooldownSeconds: number; passingScore?: number; timeLimitSeconds?: number | null;
}
export interface AttemptAvailability {
  allowed: boolean; attemptsRemaining: number | null; cooldownUntil: Date | null;
  reason: "AVAILABLE" | "ATTEMPT_LIMIT_REACHED" | "COOLDOWN" | "ACTIVE_ATTEMPT";
}
export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}
function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, index) => deepEqualJson(value, b[index]));
  if (typeof a === "object" && typeof b === "object") {
    const left = a as Record<string, unknown>; const right = b as Record<string, unknown>;
    const lk = Object.keys(left).sort(); const rk = Object.keys(right).sort();
    return lk.length === rk.length && lk.every((key, index) => key === rk[index] && deepEqualJson(left[key], right[key]));
  }
  return false;
}
function grade(question: QuestionDefinition, answer: unknown): { correct: boolean | null; review: boolean } {
  if (question.requiresManualReview) return { correct: null, review: true };
  switch (question.type) {
    case "SINGLE_CHOICE":
    case "TRUE_FALSE": return { correct: typeof answer === "string" && question.correctOptionIds?.length === 1 && answer === question.correctOptionIds[0], review: false };
    case "MULTIPLE_SELECT": {
      if (!Array.isArray(answer) || !answer.every((value) => typeof value === "string")) return { correct: false, review: false };
      return { correct: deepEqualJson([...new Set(answer as string[])].sort(), [...new Set(question.correctOptionIds ?? [])].sort()), review: false };
    }
    case "SHORT_ANSWER":
      if (typeof answer !== "string") return { correct: false, review: false };
      if (!question.acceptedAnswers?.length) return { correct: null, review: true };
      return { correct: question.acceptedAnswers.some((candidate) => normalizeAnswer(candidate) === normalizeAnswer(answer)), review: false };
    case "MATCHING":
    case "ORDERING": return { correct: deepEqualJson(answer, question.correctAnswer), review: false };
    default: { const exhaustive: never = question.type; return exhaustive; }
  }
}
export function scoreAssessment(questions: readonly QuestionDefinition[], answers: readonly AnswerInput[], passingScore: number): AssessmentResult {
  const submitted = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
  const questionResults = questions.filter((question) => question.isRequired !== false).map((question) => {
    const result = submitted.has(question.id) ? grade(question, submitted.get(question.id)) : { correct: false, review: false };
    const maxPoints = Math.max(0, question.points);
    return { questionId: question.id, isCorrect: result.correct, pointsEarned: result.correct ? maxPoints : 0, maxPoints, needsReview: result.review };
  });
  const earnedPoints = questionResults.reduce((sum, row) => sum + row.pointsEarned, 0);
  const maxPoints = questionResults.reduce((sum, row) => sum + row.maxPoints, 0);
  const percentage = maxPoints === 0 ? 0 : Math.round(earnedPoints / maxPoints * 10_000) / 100;
  const pendingReview = questionResults.some((row) => row.needsReview);
  return { earnedPoints, maxPoints, percentage, passed: !pendingReview && percentage >= passingScore, pendingReview, questionResults };
}
export function shuffle<T>(values: readonly T[], random: () => number = Math.random): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
export function attemptDeadline(startedAt: Date, timeLimitSeconds: number | null): Date | null {
  return timeLimitSeconds === null ? null : new Date(startedAt.getTime() + timeLimitSeconds * 1_000);
}
export const getAttemptDeadline = attemptDeadline;
export function isAttemptExpired(deadlineAt: Date | null, now = new Date()): boolean {
  return deadlineAt !== null && now.getTime() > deadlineAt.getTime();
}
export function evaluateAttemptAvailability(input: {
  policy: AttemptPolicy; attemptCount: number; activeAttempt?: boolean; lastFinishedAt: Date | null; now?: Date;
}): AttemptAvailability {
  const now = input.now ?? new Date();
  if (input.activeAttempt) return { allowed: false, attemptsRemaining: null, cooldownUntil: null, reason: "ACTIVE_ATTEMPT" };
  if (input.policy.maxAttempts !== null && input.attemptCount >= input.policy.maxAttempts)
    return { allowed: false, attemptsRemaining: 0, cooldownUntil: null, reason: "ATTEMPT_LIMIT_REACHED" };
  if (input.policy.retryCooldownSeconds > 0 && input.lastFinishedAt) {
    const cooldownUntil = new Date(input.lastFinishedAt.getTime() + input.policy.retryCooldownSeconds * 1_000);
    if (now < cooldownUntil) return {
      allowed: false, attemptsRemaining: input.policy.maxAttempts === null ? null : input.policy.maxAttempts - input.attemptCount,
      cooldownUntil, reason: "COOLDOWN",
    };
  }
  return {
    allowed: true, attemptsRemaining: input.policy.maxAttempts === null ? null : Math.max(0, input.policy.maxAttempts - input.attemptCount),
    cooldownUntil: null, reason: "AVAILABLE",
  };
}