/** Public API for the AI Consultant domain. */
export { sendConsultationMessage, listConsultations, ConsultationAccessError } from "./services/consultation.service";
export { requestConsultationHandoff } from "./services/handoff.service";
export { buildConsultantSystemPrompt } from "./prompts/consultant-prompts";
export { chunkKnowledgeText, normalizeKnowledgeText } from "./rag/chunking";
export { indexKnowledgeText } from "./rag/indexing";
export { retrieveKnowledge } from "./rag/retrieval";
export { OpenRouterProvider } from "./providers/openrouter.provider";
export { OpenRouterEmbeddingProvider } from "./rag/openrouter-embedding.provider";
export { MockLlmProvider } from "./providers/mock.provider";
export type { LlmProvider, EmbeddingProvider, ChatCompletionOptions, ChatCompletionResult } from "./providers/provider.types";
