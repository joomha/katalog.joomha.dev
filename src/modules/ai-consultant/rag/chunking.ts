export interface TextChunk {
  index: number;
  content: string;
  characterCount: number;
}

export interface ChunkingOptions {
  maxCharacters?: number;
  overlapCharacters?: number;
}

export function normalizeKnowledgeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Character-based chunking keeps the ingestion pipeline provider-independent.
 * Prefer paragraph/sentence boundaries and retain a bounded overlap for context.
 */
export function chunkKnowledgeText(input: string, options: ChunkingOptions = {}): TextChunk[] {
  const text = normalizeKnowledgeText(input);
  if (!text) return [];

  const maxCharacters = Math.min(Math.max(options.maxCharacters ?? 2_400, 300), 8_000);
  const overlapCharacters = Math.min(
    Math.max(options.overlapCharacters ?? 240, 0),
    Math.floor(maxCharacters / 3),
  );
  const chunks: TextChunk[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let end = Math.min(cursor + maxCharacters, text.length);
    if (end < text.length) {
      const window = text.slice(cursor, end);
      const paragraph = window.lastIndexOf("\n\n");
      const sentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
      const boundary = paragraph > maxCharacters * 0.55 ? paragraph : sentence;
      if (boundary > maxCharacters * 0.55) end = cursor + boundary + 1;
    }

    const content = text.slice(cursor, end).trim();
    if (content) {
      chunks.push({ index: chunks.length, content, characterCount: content.length });
    }
    if (end >= text.length) break;
    cursor = Math.max(end - overlapCharacters, cursor + 1);
  }

  return chunks;
}
