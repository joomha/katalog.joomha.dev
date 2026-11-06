export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING" | "ORDERING";
export interface QuestionDefinition {
  id: string; type: QuestionType; points: number; correctOptionIds?: string[];
  acceptedAnswers?: string[]; correctAnswer?: unknown; requiresManualReview?: boolean; isRequired?: boolean;
}
export interface AnswerInput { questionId: string; answer: unknown; }
export interface QuestionResult { questionId: string; isCorrect: boolean | null; pointsEarned: number; maxPoints: number; needsReview: boolean; }
export interface AssessmentResult { earnedPoints: number; maxPoints: number; percentage: number; passed: boolean; pendingReview: boolean; questionResults: QuestionResult[]; }
export function normalizeAnswer(s: string): string {
  return s.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}
function equalJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equalJson(v, b[i]));
  if (typeof a === "object" && typeof b === "object") {
    const x = a as Record<string, unknown>; const y = b as Record<string, unknown>;
    const kx = Object.keys(x).sort(); const ky = Object.keys(y).sort();
    return kx.length === ky.length && kx.every((k, i) => k === ky[i] && equalJson(x[k], y[k]));
  }
  return false;
}
function grade(q: QuestionDefinition, a: unknown): { correct: boolean | null; review: boolean } {
  if (q.requiresManualReview) return { correct: null, review: true };
  switch (q.type) {
    case "SINGLE_CHOICE":
    case "TRUE_FALSE": return { correct: typeof a === "string" && q.correctOptionIds?.length === 1 && a === q.correctOptionIds[0], review: false };
    case "MULTIPLE_SELECT": return { correct: Array.isArray(a) && a.every((v) => typeof v === "string") && equalJson([...new Set(a)].sort(), [...new Set(q.correctOptionIds ?? [])].sort(),), review: false };
    case "SHORT_ANSWER": return typeof a !== "string" || !(q.acceptedAnswers?.length)
      ? { correct: false, review: false }
      : { correct: q.acceptedAnswers.some((v) => normalizeAnswer(v) === normalizeAnswer(a)), review: false };
    case "MATCHING":
    case "ORDERING": return { correct: equalJson(a, q.correctAnswer), review: false };
    default: { const exhaustive: never = q.type; return exhaustive; }
  }
}
export function scoreAssessment(questions: readonly QuestionDefinition[], answers: readonly AnswerInput[], passingScore: number): AssessmentResult {
  const submitted = new Map(answers.map((a) => [a.questionId, a.answer]));
  const questionResults = questions.filter((q) => q.isRequired !== false).map((q) => {
    const hasAnswer = submitted.has(q.id);
    const g = hasAnswer ? grade(q, submitted.get(q.id)) : { correct: false, review: false };
    const maxPoints = Math.max(0, q.points);
    return { questionId: q.id, isCorrect: g.correct, pointsEarned: g.correct ? maxPoints : 0, maxPoints, needsReview: g.review };
  });
  const earnedPoints = questionResults.reduce((sum, q) => sum + q.pointsEarned, 0);
  const maxPoints = questionResults.reduce((sum, q) => sum + q.maxPoints, 0);
  const percentage = maxPoints === 0 ? 0 : Math.round(earnedPoints / maxPoints * 10_000) / 100;
  const pendingReview = questionResults.some((q) => q.needsReview);
  return { earnedPoints, maxPoints, percentage, passed: !pendingReview && percentage >= passingScore, pendingReview, questionResults };
}
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function attemptDeadline(startedAt: Date, limitSeconds: number | null): Date | null {
  return limitSeconds === null ? null : new Date(startedAt.getTime() + limitSeconds * 1_000);
}
