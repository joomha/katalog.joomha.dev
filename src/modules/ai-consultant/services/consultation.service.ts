import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { ChatMessage } from "../providers/provider.types";
import { OpenRouterProvider } from "../providers/openrouter.provider";
import { ProviderError } from "../providers/provider.types";
import { buildConsultantSystemPrompt } from "../prompts/consultant-prompts";
import { consultationMessageSchema, type ConsultationMode } from "../schemas/consultation.schema";
import { consultantToolDefinitions, executeConsultantTool } from "../tools/allowlist";
import { OpenRouterEmbeddingProvider } from "../rag/openrouter-embedding.provider";
import { retrieveKnowledge } from "../rag/retrieval";

const provider = new OpenRouterProvider();
const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 3;

export class ConsultationAccessError extends Error {
  constructor() { super("Percakapan tidak ditemukan atau akses ditolak."); this.name = "ConsultationAccessError"; }
}

export async function sendConsultationMessage(input: unknown, userId?: string) {
  const parsed = consultationMessageSchema.safeParse(input);
  if (!parsed.success) throw new Error("Format pesan konsultasi tidak valid.");
  const data = parsed.data;
  let conversation = data.conversationId ? await prisma.consultationConversation.findUnique({ where: { id: data.conversationId } }) : null;
  if (data.conversationId && (!conversation || (conversation.userId && conversation.userId !== userId) ||
      (!conversation.userId && conversation.guestSessionId !== data.guestSessionId))) throw new ConsultationAccessError();
  if (!conversation) {
    conversation = await prisma.consultationConversation.create({ data: { userId: userId ?? null, guestSessionId: userId ? null : data.guestSessionId, mode: data.mode } });
  }
  if (["HUMAN_HANDOFF", "HUMAN_ASSIGNED", "PENDING_REVIEW", "CLOSED", "CANCELLED"].includes(conversation.status)) {
    return { conversationId: conversation.id, status: conversation.status, assistantUnavailable: true, message: "Percakapan ini sedang ditangani tim Joomha. Silakan tunggu balasan admin/instruktur." };
  }

  const recentCount = await prisma.consultationMessage.count({
    where: { conversationId: conversation.id, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recentCount >= 12) throw new Error("Batas pesan tercapai. Tunggu satu menit sebelum mengirim pesan lagi.");
  await prisma.consultationMessage.create({ data: { conversationId: conversation.id, role: "USER", content: data.message } });
  const history = await prisma.consultationMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: MAX_HISTORY });
  const messages: ChatMessage[] = history.reverse().map((item) => ({
    role: (item.role === "USER" ? "user" : item.role === "TOOL" ? "tool" : "assistant") as ChatMessage["role"],
    content: item.content.slice(0, 3_000),
  }));
  let retrievedContext: string[] = [];
  let retrievedSources: Array<{ documentId: string; chunkId: string; title: string }> = [];
  try {
    const roles = userId
      ? (await prisma.userRole.findMany({ where: { userId }, select: { role: true } })).map((item) => item.role)
      : [];
    const retrieved = await retrieveKnowledge(data.message, new OpenRouterEmbeddingProvider(), { limit: 5, roles });
    retrievedContext = retrieved.map((item) => `[${item.title}] ${item.content.slice(0, 1_600)}`);
    retrievedSources = retrieved.map((item) => ({ documentId: item.documentId, chunkId: item.chunkId, title: item.title }));
  } catch {
    retrievedContext = [];
    retrievedSources = [];
  }
  const prompt: ChatMessage[] = [
    { role: "system", content: buildConsultantSystemPrompt(data.mode as ConsultationMode, retrievedContext) },
    ...messages,
  ];
  try {
    let result = await provider.complete({ messages: prompt, tools: consultantToolDefinitions, maxTokens: 900, temperature: 0.4 });
    let rounds = 0;
    while (result.toolCalls?.length && rounds < MAX_TOOL_ROUNDS) {
      prompt.push({ role: "assistant", content: result.content, tool_calls: result.toolCalls });
      for (const call of result.toolCalls) {
        const toolResult = await executeConsultantTool(call.function.name, call.function.arguments, { conversationId: conversation.id, userId });
        prompt.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(toolResult) });
        await prisma.consultationMessage.create({ data: { conversationId: conversation.id, role: "TOOL", content: JSON.stringify({ name: call.function.name, result: toolResult }), metadata: { toolCallId: call.id } } });
      }
      rounds += 1;
      result = await provider.complete({ messages: prompt, tools: consultantToolDefinitions, maxTokens: 900, temperature: 0.4 });
    }
    const content = result.content.trim() || "Saya sudah memeriksa informasi yang tersedia. Apa detail lain yang ingin Anda pastikan?";
    const assistantMessage = await prisma.consultationMessage.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content, model: result.model, promptTokens: result.usage?.promptTokens, completionTokens: result.usage?.completionTokens, sourceRefs: retrievedSources },
    });
    await prisma.consultationConversation.update({ where: { id: conversation.id }, data: { mode: data.mode, lastMessageAt: assistantMessage.createdAt } });
    return { conversationId: conversation.id, status: conversation.status, message: content };
  } catch (error) {
    if (error instanceof ProviderError) return { conversationId: conversation.id, status: conversation.status, assistantUnavailable: true, message: error.message, errorCode: error.code };
    throw error;
  }
}

export async function listConsultations(userId: string) {
  return prisma.consultationConversation.findMany({
    where: { userId }, select: { id: true, mode: true, status: true, lastMessageAt: true, createdAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, role: true } } },
    orderBy: { lastMessageAt: "desc" }, take: 50,
  });
}
