import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/env/server";
import type { ChatCompletionOptions, ChatCompletionResult, LlmProvider } from "./provider.types";
import { ProviderError } from "./provider.types";

const responseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.union([z.string(), z.null()]).optional(),
      tool_calls: z.array(z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({ name: z.string(), arguments: z.string() }),
      })).optional(),
    }),
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
    if (!apiKey) throw new ProviderError("AI Consultant belum dikonfigurasi. Silakan hubungi admin Joomha.", "NOT_CONFIGURED");

    const controller = new AbortController();
    const timeoutMs = Math.min(Math.max(options.timeoutMs ?? Number(process.env.OPENROUTER_TIMEOUT_MS || 30_000), 1_000), 90_000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${env.OPENROUTER_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
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
          temperature: options.temperature ?? Number(process.env.OPENROUTER_TEMPERATURE || 0.4),
          max_tokens: options.maxTokens ?? Number(process.env.OPENROUTER_MAX_TOKENS || 900),
          ...(options.tools?.length ? { tools: options.tools, tool_choice: "auto" } : {}),
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      if (response.status === 429) throw new ProviderError("Layanan AI sedang sibuk. Coba beberapa saat lagi.", "RATE_LIMITED", true);
      if (!response.ok) throw new ProviderError(`Penyedia AI mengembalikan status ${response.status}.`, "UPSTREAM", response.status >= 500);
      const parsed = responseSchema.safeParse(await response.json());
      if (!parsed.success) throw new ProviderError("Respons penyedia AI tidak sesuai format.", "INVALID_RESPONSE");
      const choice = parsed.data.choices[0];
      const content = choice.message.content ?? "";
      const toolCalls = choice.message.tool_calls ?? [];
      if (!content.trim() && toolCalls.length === 0) throw new ProviderError("Penyedia AI tidak menghasilkan jawaban.", "INVALID_RESPONSE");
      return {
        content,
        model: parsed.data.model ?? options.model ?? env.OPENROUTER_DEFAULT_MODEL,
        toolCalls,
        usage: parsed.data.usage ? {
          promptTokens: parsed.data.usage.prompt_tokens,
          completionTokens: parsed.data.usage.completion_tokens,
          totalTokens: parsed.data.usage.total_tokens,
        } : undefined,
        finishReason: choice.finish_reason ?? null,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new ProviderError("Permintaan AI melewati batas waktu.", "TIMEOUT", true);
      throw new ProviderError("Tidak dapat menghubungi penyedia AI saat ini.", "UPSTREAM", true);
    } finally {
      clearTimeout(timeout);
    }
  }
}
