import type { LearningGameConfig } from "../schemas/game.schema";
function normalize(s: string): string { return s.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID"); }
function word(s: string): string { return normalize(s).replace(/[^a-z0-9À-ÿ]/gi, ""); }
export interface GameGrade { score: number; maxScore: number; percentage: number; passed: boolean; expired: boolean; correctCount: number; totalCount: number; }
export function gradeLearningGame(g: LearningGameConfig, answers: Record<string, unknown>, elapsedMs = 0): GameGrade {
  let results: boolean[] = []; let expired = false;
  const get = (id: string) => Object.prototype.hasOwnProperty.call(answers, id) ? answers[id] : undefined;
  switch (g.type) {
    case "CROSSWORD": results = g.config.entries.map((e) => word(String(get(e.id) ?? "")) === word(e.answer)); break;
    case "MULTIPLE_CHOICE": results = g.config.questions.map((q) => get(q.id) === q.correctOptionId); break;
    case "TRUE_FALSE": results = g.config.questions.map((q) => get(q.id) === q.correctAnswer); break;
    case "MATCHING_PAIRS": results = g.config.pairs.map((p) => get(p.id) === p.right); break;
    case "WORD_SCRAMBLE": results = g.config.words.map((w) => word(String(get(w.id) ?? "")) === word(w.answer)); break;
    case "FILL_IN_THE_BLANK": results = g.config.prompts.map((p) => p.acceptedAnswers.some((a) => p.caseSensitive ? String(get(p.id) ?? "").trim() === a.trim() : normalize(String(get(p.id) ?? "")) === normalize(a))); break;
    case "FLASHCARDS": results = g.config.cards.map((c) => get(c.id) === "KNOWN"); break;
    case "ORDERING": {
      const actual = Array.isArray(answers.order) ? answers.order : [];
      const expected = [...g.config.items].sort((a, b) => a.correctPosition - b.correctPosition).map((i) => i.id);
      results = [actual.length === expected.length && actual.every((v, i) => v === expected[i])]; break;
    }
    case "TIMED_CHALLENGE": expired = elapsedMs > g.config.timeLimitSeconds * 1_000; results = g.config.questions.map((q) => get(q.id) === q.correctOptionId); break;
    default: { const exhaustive: never = g; return exhaustive; }
  }
  const correctCount = results.filter(Boolean).length;
  const maxScore = results.length * g.scoring.pointsPerCorrect;
  const score = expired ? 0 : correctCount * g.scoring.pointsPerCorrect;
  const percentage = maxScore === 0 ? 0 : Math.round(score / maxScore * 10_000) / 100;
  return { score, maxScore, percentage, passed: !expired && percentage >= g.scoring.passingScore, expired, correctCount, totalCount: results.length };
}

/** Produces learner-safe config. All keys/answers/backs are kept server-side. */
export function toPublicGameConfig(g: LearningGameConfig): Record<string, unknown> {
  const base = { type: g.type, title: g.title, introduction: g.introduction, instructions: g.instructions };
  switch (g.type) {
    case "CROSSWORD": return { ...base, rows: g.config.rows, columns: g.config.columns, entries: g.config.entries.map(({ id, number, direction, row, column, clue, answer }) => ({ id, number, direction, row, column, clue, length: answer.length })) };
    case "MULTIPLE_CHOICE": return { ...base, questions: g.config.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) };
    case "TRUE_FALSE": return { ...base, questions: g.config.questions.map(({ id, statement }) => ({ id, statement })) };
    case "MATCHING_PAIRS": return { ...base, leftItems: g.config.pairs.map(({ id, left }) => ({ id, text: left })), rightItems: g.config.pairs.map(({ id, right }) => ({ id, text: right })) };
    case "WORD_SCRAMBLE": return { ...base, words: g.config.words.map(({ id, clue, answer }) => ({ id, clue, letters: answer.replace(/\s/g, "").split("") })) };
    case "FILL_IN_THE_BLANK": return { ...base, prompts: g.config.prompts.map(({ id, sentence }) => ({ id, sentence })) };
    case "FLASHCARDS": return { ...base, cards: g.config.cards.map(({ id, front, hint }) => ({ id, front, hint })) };
    case "ORDERING": return { ...base, items: g.config.items.map(({ id, text }) => ({ id, text })) };
    case "TIMED_CHALLENGE": return { ...base, timeLimitSeconds: g.config.timeLimitSeconds, questions: g.config.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) };
    default: { const exhaustive: never = g; return exhaustive; }
  }
}
