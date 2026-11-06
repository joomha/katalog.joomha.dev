import "server-only";
import { prisma } from "@/lib/db/prisma";
import { handoffConsentSchema } from "../schemas/consultation.schema";

export async function requestConsultationHandoff(input: unknown, userId?: string) {
  const parsed = handoffConsentSchema.safeParse(input);
  if (!parsed.success) throw new Error("Persetujuan handoff tidak valid.");
  const data = parsed.data;
  const conversation = await prisma.consultationConversation.findUnique({ where: { id: data.conversationId }, include: { messages: { orderBy: { createdAt: "asc" } }, summary: true } });
  if (!conversation || (conversation.userId && conversation.userId !== userId) ||
      (!conversation.userId && conversation.guestSessionId !== data.guestSessionId)) throw new Error("Percakapan tidak ditemukan atau akses ditolak.");
  if (["CLOSED", "CANCELLED"].includes(conversation.status)) throw new Error("Percakapan sudah ditutup.");
  const includeTranscript = data.consentScope.includes("TRANSCRIPT");
  const includeContact = data.consentScope.includes("CONTACT_DETAILS");
  const includeSummary = data.consentScope.includes("CONSULTATION_SUMMARY");
  const transcript = includeTranscript
    ? conversation.messages.map((message) => ({ role: message.role, content: message.content, createdAt: message.createdAt.toISOString() }))
    : null;
  const summary = includeSummary ? conversation.summary?.payload ?? null : null;
  const customerName = includeContact ? data.customerName : null;
  const customerEmail = includeContact ? data.customerEmail : null;
  const customerPhone = includeContact ? data.customerPhone : null;
  const lead = await prisma.consultationLead.upsert({
    where: { conversationId: conversation.id },
    create: { conversationId: conversation.id, userId: conversation.userId, customerName, customerEmail, customerPhone, mode: conversation.mode, payload: { transcript, summary, reason: "CUSTOMER_REQUESTED_HANDOFF" } },
    update: { customerName, customerEmail, customerPhone, payload: { transcript, summary, reason: "CUSTOMER_REQUESTED_HANDOFF" } },
  });
  await prisma.consultationConversation.update({ where: { id: conversation.id }, data: { status: "PENDING_REVIEW", handoffReason: "CUSTOMER_REQUESTED_HANDOFF", consentAt: new Date(), consentScope: data.consentScope } });
  return { leadId: lead.id, conversationId: conversation.id, status: "PENDING_REVIEW" as const };
}
