export interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ChatToolCall[];
}

export interface ChatToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  messages: ChatMessage[];
  tools?: ChatToolDefinition[];
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  toolCalls?: ChatToolCall[];
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  finishReason?: string | null;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

export interface LlmProvider {
  readonly name: string;
  complete(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_CONFIGURED" | "TIMEOUT" | "RATE_LIMITED" | "UPSTREAM" | "INVALID_RESPONSE",
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
