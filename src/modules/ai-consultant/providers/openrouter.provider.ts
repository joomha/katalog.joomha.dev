import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/env/server";
import {
  ChatCompletionOptions,
  ChatCompletionResult,
  LlmProvider,
  ProviderError,
} from "./provider.types";

const responseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.union([z.string(), z.null()]).optional() }),
    finish_reason: z.string().nullable().optional(),
  })).min(1),
  model: z.string().optional(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
});

export class OpenRouterProvider implements LlmProvider {
  readonly name = "openrouter";

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const env = getServerEnv();
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new ProviderError(
        "AI Consultant belum dikonfigurasi. Silakan hubungi admin Joomha.",
        "NOT_CONFIGURED",
      );
    }

    const controller = new AbortController();
    const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 30_000, 1_000), 90_000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${env.OPENROUTER_BASE_URL.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://edu.joomha.dev",
            "X-Title": "Joomha Education",
          },
          body: JSON.stringify({
            model: options.model ?? env.OPENROUTER_DEFAULT_MODEL,
            messages: options.messages,
            temperature: options.temperature ?? 0.4,
            max_tokens: options.maxTokens ?? 900,
          }),
          signal: controller.signal,
          cache: "no-store",
        },
      );

      if (response.status === 429) {
        throw new ProviderError("Layanan AI sedang sibuk. Coba beberapa saat lagi.", "RATE_LIMITED", true);
      }
      if (!response.ok) {
        throw new ProviderError(
          `Penyedia AI mengembalikan status ${response.status}.`,
          "UPSTREAM",
          response.status >= 500,
        );
      }

      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new ProviderError("Respons penyedia AI tidak sesuai format.", "INVALID_RESPONSE");
      }

      const choice = parsed.data.choices[0];
      const content = choice.message.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new ProviderError("Penyedia AI tidak menghasilkan jawaban teks.", "INVALID_RESPONSE");
      }

      return {
        content,
        model: parsed.data.model ?? options.model ?? env.OPENROUTER_DEFAULT_MODEL,
        usage: parsed.data.usage ? {
          promptTokens: parsed.data.usage.prompt_tokens,
          completionTokens: parsed.data.usage.completion_tokens,
          totalTokens: parsed.data.usage.total_tokens,
        } : undefined,
        finishReason: choice.finish_reason ?? null,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ProviderError("Permintaan AI melewati batas waktu.", "TIMEOUT", true);
      }
      throw new ProviderError("Tidak dapat menghubungi penyedia AI saat ini.", "UPSTREAM", true);
    } finally {
      clearTimeout(timeout);
    }
  }
}
