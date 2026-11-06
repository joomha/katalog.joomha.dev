import type { ChatCompletionOptions, ChatCompletionResult, LlmProvider } from "./provider.types";

/** Deterministic provider for unit tests and local UI integration. */
export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";
  constructor(private readonly response = "Terima kasih. Bisa ceritakan sedikit lebih lanjut tentang tujuan Anda?") {}
  async complete(_options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    return { content: this.response, model: "mock/consultant", finishReason: "stop" };
  }
}
