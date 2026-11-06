import { z } from "zod";
const text = z.string().trim().min(1).max(2_000);
const base = {
  title: z.string().trim().min(1).max(200), introduction: z.string().max(5_000).default(""),
  instructions: z.string().trim().min(1).max(5_000),
  scoring: z.object({ pointsPerCorrect: z.number().positive().max(100).default(10), passingScore: z.number().min(0).max(100).default(70), penalizeWrongAnswer: z.boolean().default(false) })
    .default({ pointsPerCorrect: 10, passingScore: 70, penalizeWrongAnswer: false }),
};
export const CrosswordGameSchema = z.object({
  type: z.literal("CROSSWORD"), ...base,
  config: z.object({
    rows: z.number().int().min(3).max(30), columns: z.number().int().min(3).max(30),
    entries: z.array(z.object({
      id: z.string().min(1).max(60), number: z.number().int().positive(), direction: z.enum(["ACROSS", "DOWN"]),
      row: z.number().int().min(0), column: z.number().int().min(0),
      answer: z.string().trim().min(2).max(30).regex(/^[A-Za-zÀ-ÿ]+$/), clue: text,
    })).min(1).max(60),
  }),
}).superRefine((g, ctx) => g.config.entries.forEach((e, i) => {
  const rowEnd = e.row + (e.direction === "DOWN" ? e.answer.length - 1 : 0);
  const colEnd = e.column + (e.direction === "ACROSS" ? e.answer.length - 1 : 0);
  if (rowEnd >= g.config.rows || colEnd >= g.config.columns) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Jawaban keluar dari grid.", path: ["config", "entries", i] });
}));
export const MultipleChoiceGameSchema = z.object({
  type: z.literal("MULTIPLE_CHOICE"), ...base,
  config: z.object({ questions: z.array(z.object({
    id: z.string().min(1).max(60), prompt: text,
    options: z.array(z.object({ id: z.string().min(1).max(60), text })).min(2).max(8),
    correctOptionId: z.string().min(1).max(60), explanation: z.string().max(2_000).optional(),
  })).min(1).max(100) }),
}).superRefine((g, ctx) => g.config.questions.forEach((q, i) => {
  if (!q.options.some((o) => o.id === q.correctOptionId)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Opsi benar tidak ditemukan.", path: ["config", "questions", i] });
}));
export const TrueFalseGameSchema = z.object({
  type: z.literal("TRUE_FALSE"), ...base,
  config: z.object({ questions: z.array(z.object({
    id: z.string().min(1).max(60), statement: text, correctAnswer: z.boolean(), explanation: z.string().max(2_000).optional(),
  })).min(1).max(100) }),
});
export const MatchingPairsGameSchema = z.object({
  type: z.literal("MATCHING_PAIRS"), ...base,
  config: z.object({ pairs: z.array(z.object({ id: z.string().min(1).max(60), left: text, right: text })).min(2).max(50), shuffleRight: z.boolean().default(true) }),
});
export const WordScrambleGameSchema = z.object({
  type: z.literal("WORD_SCRAMBLE"), ...base,
  config: z.object({ words: z.array(z.object({ id: z.string().min(1).max(60), clue: text, answer: z.string().trim().min(2).max(40).regex(/^[A-Za-zÀ-ÿ ]+$/) })).min(1).max(100) }),
});
export const FillBlankGameSchema = z.object({
  type: z.literal("FILL_IN_THE_BLANK"), ...base,
  config: z.object({ prompts: z.array(z.object({
    id: z.string().min(1).max(60), sentence: text, acceptedAnswers: z.array(z.string().trim().min(1).max(100)).min(1).max(20), caseSensitive: z.boolean().default(false),
  })).min(1).max(100) }),
});
export const FlashcardsGameSchema = z.object({
  type: z.literal("FLASHCARDS"), ...base,
  config: z.object({ cards: z.array(z.object({ id: z.string().min(1).max(60), front: text, back: text, hint: z.string().max(500).optional() })).min(1).max(200), allowSelfRating: z.boolean().default(true) }),
});
export const OrderingGameSchema = z.object({
  type: z.literal("ORDERING"), ...base,
  config: z.object({ items: z.array(z.object({ id: z.string().min(1).max(60), text, correctPosition: z.number().int().positive() })).min(2).max(50) })
    .superRefine((c, ctx) => {
      const positions = c.items.map((i) => i.correctPosition);
      if (new Set(positions).size !== positions.length || positions.some((p) => p > positions.length)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Posisi harus unik dan berurutan.", path: ["items"] });
    }),
});
export const TimedChallengeGameSchema = z.object({
  type: z.literal("TIMED_CHALLENGE"), ...base,
  config: z.object({ timeLimitSeconds: z.number().int().min(5).max(3_600), questions: z.array(z.object({
    id: z.string().min(1).max(60), prompt: text,
    options: z.array(z.object({ id: z.string().min(1).max(60), text })).min(2).max(8), correctOptionId: z.string().min(1).max(60),
  })).min(1).max(100) }),
}).superRefine((g, ctx) => g.config.questions.forEach((q, i) => {
  if (!q.options.some((o) => o.id === q.correctOptionId)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Opsi benar tidak ditemukan.", path: ["config", "questions", i] });
}));
export const LearningGameConfigSchema = z.discriminatedUnion("type", [
  CrosswordGameSchema, MultipleChoiceGameSchema, TrueFalseGameSchema, MatchingPairsGameSchema, WordScrambleGameSchema,
  FillBlankGameSchema, FlashcardsGameSchema, OrderingGameSchema, TimedChallengeGameSchema,
]);
export const GameSubmissionSchema = z.object({ answers: z.record(z.string(), z.unknown()) });
export type LearningGameConfig = z.infer<typeof LearningGameConfigSchema>;
