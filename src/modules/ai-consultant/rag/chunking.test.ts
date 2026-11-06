import { describe, expect, it } from "vitest";
import { chunkKnowledgeText, normalizeKnowledgeText } from "./chunking";

describe("knowledge text normalization", () => {
  it("normalizes line endings and excessive whitespace", () => {
    expect(normalizeKnowledgeText("  Joomha\r\n\r\n\r\nEducation  ")).toBe("Joomha\n\nEducation");
  });
});

describe("knowledge chunking", () => {
  it("returns no chunks for empty content", () => {
    expect(chunkKnowledgeText("  ")).toEqual([]);
  });

  it("keeps all content and assigns sequential indexes", () => {
    const input = Array.from({ length: 30 }, (_, i) => `Paragraf ${i}. Ini materi pengetahuan Joomha.\n\n`).join("");
    const chunks = chunkKnowledgeText(input, { maxCharacters: 350, overlapCharacters: 40 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.index)).toEqual(chunks.map((_, index) => index));
    expect(chunks.every((chunk) => chunk.content.length <= 350)).toBe(true);
    expect(chunks[0].content).toContain("Paragraf 0");
    expect(chunks[chunks.length - 1].content).toContain("Paragraf 29");
  });

  it("bounds options to safe limits", () => {
    const chunks = chunkKnowledgeText("x".repeat(10_000), { maxCharacters: 50_000, overlapCharacters: 50_000 });
    expect(chunks.every((chunk) => chunk.content.length <= 8_000)).toBe(true);
  });
});
