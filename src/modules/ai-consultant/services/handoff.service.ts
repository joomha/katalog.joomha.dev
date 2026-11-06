import "server-only";
import { prisma } from "@/lib/db/prisma";
import { handoffConsentSchema } from "../schemas/consultation.schema";

export async function requestConsultationHandoff(input: unknown, userId?: string) {
  const parsed = handoffConsentSchema.safeParse(input);
  if (!parsed.success) throw new Error("Persetujuan handoff tidak valid.");
  const data = parsed.data;
  const conversation = await prisma.consultationConversation.findUnique({
    where: { id: data.conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || (conversation.userId && conversation.userId !== userId) ||
      (!conversation.userId && !userId)) {
    throw new Error("Percakapan tidak ditemukan atau akses ditolak.");
  }
  if (conversation.status === "CLOSED" || conversation.status === "CANCELLED") {
    throw new Error("Percakapan sudah ditutup.");
  }
  const transcript = conversation.messages.map((message) => ({
    role: message.role, content: message.content, createdAt: message.createdAt.toISOString(),
  }));
  const lead = await prisma.consultationLead.upsert({
    where: { conversationId: conversation.id },
    create: {
      conversationId: conversation.id, userId: conversation.userId,
      customerName: data.customerName, customerEmail: data.customerEmail,
      customerPhone: data.customerPhone, mode: conversation.mode,
      payload: { transcript, reason: "CUSTOMER_REQUESTED_HANDOFF" },
    },
    update: {
      customerName: data.customerName, customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      payload: { transcript, reason: "CUSTOMER_REQUESTED_HANDOFF" },
    },
  });
  await prisma.consultationConversation.update({
    where: { id: conversation.id },
    data: {
      status: "PENDING_REVIEW",
      handoffReason: "CUSTOMER_REQUESTED_HANDOFF",
      consentAt: new Date(),
      consentScope: data.consentScope,
    },
  });
  return { leadId: lead.id, conversationId: conversation.id, status: "PENDING_REVIEW" as const };
}
