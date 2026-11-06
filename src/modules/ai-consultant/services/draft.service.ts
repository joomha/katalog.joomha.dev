import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const draftSchema = z.object({
  conversationId: z.string().uuid(),
  guestSessionId: z.string().min(16).max(128).optional(),
  consent: z.literal(true),
  mode: z.enum(["LEARNING", "BUSINESS"]),
  details: z.record(z.string(), z.unknown()),
});

export async function createConsultationDraft(input: unknown, userId?: string) {
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) throw new Error("Draft tidak valid atau consent belum diberikan.");
  const data = parsed.data;
  const conversation = await prisma.consultationConversation.findUnique({ where: { id: data.conversationId } });
  if (!conversation || (conversation.userId && conversation.userId !== userId) ||
      (!conversation.userId && conversation.guestSessionId !== data.guestSessionId)) {
    throw new Error("Percakapan tidak ditemukan atau akses ditolak.");
  }
  if (conversation.status !== "AI_CONSULTATION") throw new Error("Percakapan tidak lagi menerima draft AI.");
  const safeDetails = JSON.parse(JSON.stringify(data.details)) as Prisma.InputJsonValue;
  const payload = { status: "DRAFT", details: safeDetails, consentAt: new Date().toISOString() } as Prisma.InputJsonObject;
  const lead = await prisma.consultationLead.upsert({
    where: { conversationId: conversation.id },
    create: {
      conversationId: conversation.id, userId: conversation.userId, mode: data.mode,
      payload,
    },
    update: {
      mode: data.mode,
      payload: { status: "DRAFT", details: data.details, consentAt: new Date().toISOString() },
    },
  });
  await prisma.consultationConversation.update({
    where: { id: conversation.id },
    data: { consentAt: new Date(), consentScope: ["DRAFT_REQUEST"] },
  });
  return { draftId: lead.id, status: "DRAFT" as const };
}
