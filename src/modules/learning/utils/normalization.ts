/** Normalization helpers shared by assessment and game grading. */
export function normalizeLearningText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}
export function normalizeWordAnswer(value: string): string {
  return value.normalize("NFKC").replace(/[\s\p{P}\p{S}]+/gu, "").toLocaleLowerCase("id-ID");
}
