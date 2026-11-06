import { describe, expect, it } from "vitest";
import { LearningGameConfigSchema } from "../schemas/game.schema";
import { gradeLearningGame, toPublicGameConfig } from "../services/game-engine";
const mcq = {
  type: "MULTIPLE_CHOICE", title: "Excel", instructions: "Pilih jawaban.",
  config: { questions: [{ id: "q1", prompt: "Fungsi penjumlahan?", options: [{ id: "a", text: "SUM" }, { id: "b", text: "COUNT" }], correctOptionId: "a" }] },
};
describe("game engine", () => {
  it("validates the nine supported game types", () => {
    const fixtures = [
      { type: "CROSSWORD", title: "TTS", instructions: "Isi.", config: { rows: 5, columns: 5, entries: [{ id: "e", number: 1, direction: "ACROSS", row: 0, column: 0, answer: "DATA", clue: "Informasi" }] } },
      mcq,
      { type: "TRUE_FALSE", title: "Benar Salah", instructions: "Jawab.", config: { questions: [{ id: "q", statement: "Spreadsheet.", correctAnswer: true }] } },
      { type: "MATCHING_PAIRS", title: "Cocokkan", instructions: "Pasangkan.", config: { pairs: [{ id: "a", left: "SUM", right: "Jumlah" }, { id: "b", left: "AVG", right: "Rata-rata" }] } },
      { type: "WORD_SCRAMBLE", title: "Acak", instructions: "Susun.", config: { words: [{ id: "a", clue: "Informasi", answer: "DATA" }] } },
      { type: "FILL_IN_THE_BLANK", title: "Isi", instructions: "Lengkapi.", config: { prompts: [{ id: "a", sentence: "Rumus ____.", acceptedAnswers: ["SUM"] }] } },
      { type: "FLASHCARDS", title: "Kartu", instructions: "Belajar.", config: { cards: [{ id: "a", front: "Cell?", back: "Baris dan kolom." }] } },
      { type: "ORDERING", title: "Urut", instructions: "Susun.", config: { items: [{ id: "a", text: "Buka", correctPosition: 1 }, { id: "b", text: "Simpan", correctPosition: 2 }] } },
      { type: "TIMED_CHALLENGE", title: "Cepat", instructions: "Jawab.", config: { timeLimitSeconds: 30, questions: [{ id: "a", prompt: "Ekstensi?", options: [{ id: "x", text: ".xlsx" }, { id: "y", text: ".docx" }], correctOptionId: "x" }] } },
    ];
    expect(fixtures.every((item) => LearningGameConfigSchema.safeParse(item).success)).toBe(true);
  });
  it("grades with server-side answer keys", () => {
    const parsed = LearningGameConfigSchema.parse(mcq);
    expect(gradeLearningGame(parsed, { q1: "a" }).passed).toBe(true);
  });
  it("redacts correct keys before rendering the game to a learner", () => {
    const result = JSON.stringify(toPublicGameConfig(LearningGameConfigSchema.parse(mcq)));
    expect(result).not.toContain("correctOptionId");
  });
  it("marks a timed challenge expired using measured elapsed time", () => {
    const game = LearningGameConfigSchema.parse({ type: "TIMED_CHALLENGE", title: "Cepat", instructions: "Jawab.", config: { timeLimitSeconds: 10, questions: [{ id: "a", prompt: "Pilih", options: [{ id: "x", text: "X" }, { id: "y", text: "Y" }], correctOptionId: "x" }] } });
    expect(gradeLearningGame(game, { a: "x" }, 11_000).expired).toBe(true);
  });
});
