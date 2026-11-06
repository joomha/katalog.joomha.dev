import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { OpenRouterProvider } from "../providers/openrouter.provider";
import { ProviderError } from "../providers/provider.types";
import { buildConsultantSystemPrompt } from "../prompts/consultant-prompts";
import { consultationMessageSchema, type ConsultationMode } from "../schemas/consultation.schema";

const provider = new OpenRouterProvider();
const MAX_HISTORY = 20;

export class ConsultationAccessError extends Error {
  constructor() { super("Percakapan tidak ditemukan atau akses ditolak."); this.name = "ConsultationAccessError"; }
}

export async function sendConsultationMessage(input: unknown, userId?: string) {
  const parsed = consultationMessageSchema.safeParse(input);
  if (!parsed.success) throw new Error("Format pesan konsultasi tidak valid.");
  const data = parsed.data;

  let conversation = data.conversationId
    ? await prisma.consultationConversation.findUnique({ where: { id: data.conversationId } })
    : null;

  if (data.conversationId && (!conversation || (conversation.userId && conversation.userId !== userId) ||
      (!conversation.userId && conversation.guestSessionId !== data.guestSessionId))) {
    throw new ConsultationAccessError();
  }

  if (!conversation) {
    conversation = await prisma.consultationConversation.create({
      data: {
        userId: userId ?? null,
        guestSessionId: userId ? null : data.guestSessionId,
        mode: data.mode,
      },
    });
  }

  if (conversation.status === "HUMAN_HANDOFF" || conversation.status === "HUMAN_ASSIGNED" ||
      conversation.status === "PENDING_REVIEW" || conversation.status === "CLOSED" ||
      conversation.status === "CANCELLED") {
    return { conversationId: conversation.id, status: conversation.status, assistantUnavailable: true,
      message: "Percakapan ini sedang ditangani tim Joomha. Silakan tunggu balasan admin/instruktur." };
  }

  const userMessage = await prisma.consultationMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: data.message },
  });

  const history = await prisma.consultationMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
  });
  const messages = history.reverse().map((item) => ({
    role: item.role === "USER" ? "user" as const : item.role === "TOOL" ? "tool" as const : "assistant" as const,
    content: item.content,
  }));

  try {
    const result = await provider.complete({
      messages: [
        { role: "system", content: buildConsultantSystemPrompt(data.mode as ConsultationMode) },
        ...messages,
      ],
      maxTokens: 900,
      temperature: 0.4,
    });
    const assistantMessage = await prisma.consultationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: result.content,
        model: result.model,
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
      },
    });
    await prisma.consultationConversation.update({
      where: { id: conversation.id },
      data: { mode: data.mode, lastMessageAt: assistantMessage.createdAt },
    });
    return { conversationId: conversation.id, status: conversation.status, message: result.content };
  } catch (error) {
    if (error instanceof ProviderError) {
      return {
        conversationId: conversation.id,
        status: conversation.status,
        assistantUnavailable: true,
        message: error.message,
        errorCode: error.code,
      };
    }
    throw error;
  }
}

export async function listConsultations(userId: string) {
  return prisma.consultationConversation.findMany({
    where: { userId },
    select: {
      id: true, mode: true, status: true, lastMessageAt: true, createdAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, role: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });
}

export async function createGuestSessionId() {
  return randomUUID() + randomUUID();
}
