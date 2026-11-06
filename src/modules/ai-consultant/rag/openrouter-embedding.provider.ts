import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/env/server";
import { EmbeddingProvider, ProviderError } from "../providers/provider.types";

const embeddingResponseSchema = z.object({
  data: z.array(z.object({
    index: z.number().int().nonnegative(),
    embedding: z.array(z.number().finite()),
  })),
});

export class OpenRouterEmbeddingProvider implements EmbeddingProvider {
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.length > 64 || texts.some((text) => !text.trim() || text.length > 20_000)) {
      throw new ProviderError("Batch embedding tidak valid.", "INVALID_RESPONSE");
    }

    const env = getServerEnv();
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError("Embedding belum dikonfigurasi.", "NOT_CONFIGURED");
    }

    const model = process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small";
    const response = await fetch(
      `${env.OPENROUTER_BASE_URL.replace(/\/$/, "")}/embeddings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://edu.joomha.dev",
          "X-Title": "Joomha Education Knowledge Base",
        },
        body: JSON.stringify({ model, input: texts }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      throw new ProviderError(`Embedding provider mengembalikan status ${response.status}.`, response.status === 429 ? "RATE_LIMITED" : "UPSTREAM", response.status === 429 || response.status >= 500);
    }

    const parsed = embeddingResponseSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.data.length !== texts.length) {
      throw new ProviderError("Respons embedding tidak valid atau jumlah hasil tidak cocok.", "INVALID_RESPONSE");
    }

    const ordered = [...parsed.data.data].sort((a, b) => a.index - b.index);
    const dimension = ordered[0]?.embedding.length;
    if (!dimension || ordered.some((item) => item.embedding.length !== dimension)) {
      throw new ProviderError("Dimensi embedding tidak konsisten.", "INVALID_RESPONSE");
    }
    return ordered.map((item) => item.embedding);
  }
}
