import { describe, expect, it } from "vitest";
import { LearningGameConfigSchema } from "../schemas/game.schema";
import { gradeLearningGame, toPublicGameConfig } from "../services/game-engine";

const mcq = {
  type: "MULTIPLE_CHOICE", title: "Rumus Excel", instructions: "Pilih jawaban yang benar.",
  config: { questions: [{ id: "q1", prompt: "Fungsi penjumlahan?", options: [{ id: "a", text: "SUM" }, { id: "b", text: "COUNT" }], correctOptionId: "a" }] },
};

describe("learning game registry", () => {
  const fixtures = [
    { type: "CROSSWORD", title: "TTS", instructions: "Isi kata.", config: { rows: 5, columns: 5, entries: [{ id: "e1", number: 1, direction: "ACROSS", row: 0, column: 0, answer: "DATA", clue: "Informasi yang diolah" }] } },
    mcq,
    { type: "TRUE_FALSE", title: "Benar Salah", instructions: "Pilih.", config: { questions: [{ id: "q1", statement: "Excel adalah spreadsheet.", correctAnswer: true }] } },
    { type: "MATCHING_PAIRS", title: "Pasangkan", instructions: "Cocokkan.", config: { pairs: [{ id: "p1", left: "SUM", right: "Penjumlahan" }, { id: "p2", left: "AVERAGE", right: "Rata-rata" }] } },
    { type: "WORD_SCRAMBLE", title: "Acak Kata", instructions: "Susun.", config: { words: [{ id: "w1", clue: "Baris dan kolom", answer: "CELL" }] } },
    { type: "FILL_IN_THE_BLANK", title: "Lengkapi", instructions: "Isi.", config: { prompts: [{ id: "b1", sentence: "Fungsi penjumlahan adalah ____.", acceptedAnswers: ["SUM"] }] } },
    { type: "FLASHCARDS", title: "Kartu", instructions: "Pelajari.", config: { cards: [{ id: "f1", front: "Apa itu cell?", back: "Perpotongan baris dan kolom." }] } },
    { type: "ORDERING", title: "Urutan", instructions: "Urutkan.", config: { items: [{ id: "o1", text: "Buka aplikasi", correctPosition: 1 }, { id: "o2", text: "Buat workbook", correctPosition: 2 }] } },
    { type: "TIMED_CHALLENGE", title: "Cepat Tepat", instructions: "Jawab.", config: { timeLimitSeconds: 30, questions: [{ id: "t1", prompt: "Ekstensi workbook Excel modern?", options: [{ id: "a", text: ".xlsx" }, { id: "b", text: ".docx" }], correctOptionId: "a" }] } },
  ];
  it("accepts the nine supported game types", () => {
    for (const fixture of fixtures) expect(LearningGameConfigSchema.safeParse(fixture).success).toBe(true);
  });
  it("rejects crossword words that exceed the configured grid", () => {
    const invalid = { type: "CROSSWORD", title: "TTS", instructions: "Isi.", config: { rows: 3, columns: 3, entries: [{ id: "e1", number: 1, direction: "ACROSS", row: 0, column: 0, answer: "SPREADSHEET", clue: "Aplikasi" }] } };
    expect(LearningGameConfigSchema.safeParse(invalid).success).toBe(false);
  });
  it("grades against server config, not client correctness flags", () => {
    const parsed = LearningGameConfigSchema.parse(mcq);
    expect(gradeLearningGame(parsed, { q1: "a" }).passed).toBe(true);
    expect(gradeLearningGame(parsed, { q1: "b", correct: true }).passed).toBe(false);
  });
  it("does not serialize correct options into public game config", () => {
    const parsed = LearningGameConfigSchema.parse(mcq);
    const publicConfig = JSON.stringify(toPublicGameConfig(parsed));
    expect(publicConfig).not.toContain("correctOptionId");
    expect(publicConfig).not.toContain("correctAnswer");
  });
  it("scores an expired timed challenge as zero", () => {
    const timed = LearningGameConfigSchema.parse({
      type: "TIMED_CHALLENGE", title: "Cepat", instructions: "Jawab.",
      config: { timeLimitSeconds: 10, questions: [{ id: "q1", prompt: "Pilih.", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctOptionId: "a" }] },
    });
    const result = gradeLearningGame(timed, { q1: "a" }, 11_000);
    expect(result.expired).toBe(true);
    expect(result.score).toBe(0);
  });
});
