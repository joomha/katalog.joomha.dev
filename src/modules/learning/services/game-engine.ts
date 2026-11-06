import type { LearningGameConfig } from "../schemas/game.schema";
import { normalizeLearningText, normalizeWordAnswer } from "../utils/normalization";

export interface GameGrade {
  score: number; maxScore: number; percentage: number; passed: boolean; expired: boolean;
  correctCount: number; totalCount: number; details: Array<{ itemId: string; correct: boolean }>;
}
function recordAnswer(answers: Record<string, unknown>, id: string): unknown {
  return Object.prototype.hasOwnProperty.call(answers, id) ? answers[id] : undefined;
}
function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
function buildResult(
  details: Array<{ itemId: string; correct: boolean }>, points: number, passingScore: number, expired = false,
): GameGrade {
  const correctCount = details.filter((item) => item.correct).length;
  const maxScore = details.length * points;
  const score = expired ? 0 : correctCount * points;
  const percentage = maxScore === 0 ? 0 : Math.round(score / maxScore * 10_000) / 100;
  return {
    score, maxScore, percentage, passed: !expired && percentage >= passingScore,
    expired, correctCount, totalCount: details.length, details,
  };
}

/** Evaluates only validated, server-held game config. */
export function gradeLearningGame(game: LearningGameConfig, answers: Record<string, unknown>, durationMs = 0): GameGrade {
  const points = game.scoring.pointsPerCorrect;
  const passingScore = game.scoring.passingScore;
  switch (game.type) {
    case "CROSSWORD":
      return buildResult(game.config.entries.map((entry) => ({
        itemId: entry.id,
        correct: normalizeWordAnswer(String(recordAnswer(answers, entry.id) ?? "")) === normalizeWordAnswer(entry.answer),
      })), points, passingScore);
    case "MULTIPLE_CHOICE":
      return buildResult(game.config.questions.map((question) => ({
        itemId: question.id, correct: recordAnswer(answers, question.id) === question.correctOptionId,
      })), points, passingScore);
    case "TRUE_FALSE":
      return buildResult(game.config.questions.map((question) => ({
        itemId: question.id, correct: recordAnswer(answers, question.id) === question.correctAnswer,
      })), points, passingScore);
    case "MATCHING_PAIRS":
      return buildResult(game.config.pairs.map((pair) => ({
        itemId: pair.id, correct: recordAnswer(answers, pair.id) === pair.right,
      })), points, passingScore);
    case "WORD_SCRAMBLE":
      return buildResult(game.config.words.map((word) => ({
        itemId: word.id,
        correct: normalizeWordAnswer(String(recordAnswer(answers, word.id) ?? "")) === normalizeWordAnswer(word.answer),
      })), points, passingScore);
    case "FILL_IN_THE_BLANK":
      return buildResult(game.config.prompts.map((prompt) => {
        const raw = String(recordAnswer(answers, prompt.id) ?? "");
        const normalized = normalizeLearningText(raw);
        return {
          itemId: prompt.id,
          correct: prompt.acceptedAnswers.some((candidate) =>
            prompt.caseSensitive ? raw.trim() === candidate.trim() : normalizeLearningText(candidate) === normalized
          ),
        };
      }), points, passingScore);
    case "FLASHCARDS":
      return buildResult(game.config.cards.map((card) => ({
        itemId: card.id, correct: recordAnswer(answers, card.id) === "KNOWN",
      })), points, passingScore);
    case "ORDERING": {
      const submitted = Array.isArray(answers.order) ? answers.order : [];
      const expected = [...game.config.items].sort((a, b) => a.correctPosition - b.correctPosition).map((item) => item.id);
      return buildResult([{ itemId: "order", correct: submitted.length === expected.length && submitted.every((id, index) => id === expected[index]) }], points, passingScore);
    }
    case "TIMED_CHALLENGE": {
      const expired = durationMs > game.config.timeLimitSeconds * 1_000;
      return buildResult(game.config.questions.map((question) => ({
        itemId: question.id, correct: recordAnswer(answers, question.id) === question.correctOptionId,
      })), points, passingScore, expired);
    }
    default: { const exhaustive: never = game; return exhaustive; }
  }
}

/** Strip all answer keys and pair mappings before returning config to a student. */
export function toPublicGameConfig(game: LearningGameConfig): Record<string, unknown> {
  switch (game.type) {
    case "CROSSWORD":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        rows: game.config.rows, columns: game.config.columns,
        entries: game.config.entries.map(({ id, number, direction, row, column, clue, answer }) => ({
          id, number, direction, row, column, clue, length: answer.length,
        })),
      };
    case "MULTIPLE_CHOICE":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        questions: game.config.questions.map(({ id, prompt, options, explanation }) => ({ id, prompt, options: shuffled(options), explanation })),
      };
    case "TRUE_FALSE":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        questions: game.config.questions.map(({ id, statement, explanation }) => ({ id, statement, explanation })),
      };
    case "MATCHING_PAIRS":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        leftItems: game.config.pairs.map(({ id, left }) => ({ id, text: left })),
        rightItems: shuffled(game.config.pairs.map(({ right }, index) => ({ id: "choice-" + index + "-" + Math.random().toString(36).slice(2, 8), text: right }))),
      };
    case "WORD_SCRAMBLE":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        words: game.config.words.map(({ id, clue, answer }) => ({ id, clue, letters: shuffled(answer.replace(/\s/g, "").split("")) })),
      };
    case "FILL_IN_THE_BLANK":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        prompts: game.config.prompts.map(({ id, sentence }) => ({ id, sentence })),
      };
    case "FLASHCARDS":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        cards: game.config.cards.map(({ id, front, back, hint }) => ({ id, front, back, hint })),
      };
    case "ORDERING":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        items: shuffled(game.config.items.map(({ id, text }) => ({ id, text }))),
      };
    case "TIMED_CHALLENGE":
      return {
        type: game.type, title: game.title, introduction: game.introduction, instructions: game.instructions,
        timeLimitSeconds: game.config.timeLimitSeconds,
        questions: game.config.questions.map(({ id, prompt, options }) => ({ id, prompt, options: shuffled(options) })),
      };
    default: { const exhaustive: never = game; return exhaustive; }
  }
}
