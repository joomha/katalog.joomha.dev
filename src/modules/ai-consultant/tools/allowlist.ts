import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import type { ChatToolDefinition } from "../providers/provider.types";

const searchCatalogInput = z.object({
  query: z.string().trim().max(120).optional(),
  type: z.enum(["DIGITAL_PRODUCT", "SELF_PACED_COURSE", "PRIVATE_TUTORING", "BUSINESS_SERVICE"]).optional(),
  limit: z.number().int().min(1).max(8).default(5),
});
const getCatalogInput = z.object({ slug: z.string().trim().min(1).max(180) });
const estimateInput = z.object({
  subject: z.string().min(2).max(160),
  level: z.enum(["DASAR", "MENENGAH", "LANJUT"]),
  durationMinutes: z.number().int().min(30).max(240),
  sessions: z.number().int().min(1).max(100),
  method: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
});
const draftInput = z.object({
  consent: z.literal(true),
  details: z.record(z.string(), z.unknown()),
});
const summaryInput = z.object({
  needs: z.string().min(1).max(3000),
  targetOutcome: z.string().max(1500).optional(),
  recommendations: z.array(z.string().max(300)).max(10).default([]),
  nextAction: z.string().min(1).max(500),
});
const handoffInput = z.object({
  consent: z.literal(true),
  consentScope: z.array(z.enum(["TRANSCRIPT", "CONTACT_DETAILS", "CONSULTATION_SUMMARY"])).min(1),
  customerName: z.string().max(120).optional(),
  customerEmail: z.string().email().max(254).optional(),
  customerPhone: z.string().max(32).optional(),
});

export const consultantToolDefinitions: ChatToolDefinition[] = [
  { type: "function", function: { name: "search_catalog", description: "Cari listing kursus atau jasa yang benar-benar tersedia di katalog Joomha.", parameters: { type: "object", properties: { query: { type: "string" }, type: { type: "string", enum: ["DIGITAL_PRODUCT", "SELF_PACED_COURSE", "PRIVATE_TUTORING", "BUSINESS_SERVICE"] }, limit: { type: "integer", minimum: 1, maximum: 8 } }, additionalProperties: false } } },
  { type: "function", function: { name: "get_catalog_item", description: "Ambil detail listing katalog berdasarkan slug.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"], additionalProperties: false } } },
  { type: "function", function: { name: "get_tutoring_estimate", description: "Meminta estimasi harga les dari backend. Jangan menghitung harga sendiri.", parameters: { type: "object", properties: { subject: { type: "string" }, level: { type: "string", enum: ["DASAR", "MENENGAH", "LANJUT"] }, durationMinutes: { type: "integer" }, sessions: { type: "integer" }, method: { type: "string", enum: ["ONLINE", "OFFLINE", "HYBRID"] } }, required: ["subject", "level", "durationMinutes", "sessions", "method"], additionalProperties: false } } },
  { type: "function", function: { name: "create_tutoring_draft", description: "Buat draft kebutuhan les hanya setelah consent eksplisit.", parameters: { type: "object", properties: { consent: { type: "boolean", enum: [true] }, details: { type: "object", additionalProperties: true } }, required: ["consent", "details"], additionalProperties: false } } },
  { type: "function", function: { name: "create_business_request_draft", description: "Buat draft kebutuhan digitalisasi bisnis hanya setelah consent eksplisit.", parameters: { type: "object", properties: { consent: { type: "boolean", enum: [true] }, details: { type: "object", additionalProperties: true } }, required: ["consent", "details"], additionalProperties: false } } },
  { type: "function", function: { name: "create_consultation_summary", description: "Simpan ringkasan konsultasi yang tervalidasi untuk admin.", parameters: { type: "object", properties: { needs: { type: "string" }, targetOutcome: { type: "string" }, recommendations: { type: "array", items: { type: "string" } }, nextAction: { type: "string" } }, required: ["needs", "nextAction"], additionalProperties: false } } },
  { type: "function", function: { name: "request_human_handoff", description: "Alihkan percakapan kepada admin setelah consent eksplisit.", parameters: { type: "object", properties: { consent: { type: "boolean", enum: [true] }, consentScope: { type: "array", items: { type: "string", enum: ["TRANSCRIPT", "CONTACT_DETAILS", "CONSULTATION_SUMMARY"] } }, customerName: { type: "string" }, customerEmail: { type: "string" }, customerPhone: { type: "string" } }, required: ["consent", "consentScope"], additionalProperties: false } } },
];

export async function executeConsultantTool(name: string, rawArgs: string, context: { conversationId: string; userId?: string }) {
  let parsedJson: unknown;
  try { parsedJson = JSON.parse(rawArgs); } catch { return { ok: false, error: "Argumen tool bukan JSON valid." }; }

  if (name === "search_catalog") {
    const args = searchCatalogInput.safeParse(parsedJson);
    if (!args.success) return { ok: false, error: "Filter katalog tidak valid." };
    const items = await prisma.catalogItem.findMany({
      where: {
        status: { in: ["AVAILABLE", "COMING_SOON"] },
        ...(args.data.type ? { type: args.data.type } : {}),
        ...(args.data.query ? { OR: [
          { title: { contains: args.data.query, mode: "insensitive" } },
          { shortDescription: { contains: args.data.query, mode: "insensitive" } },
        ] } : {}),
      },
      select: { title: true, slug: true, type: true, status: true, priceType: true, priceLabel: true, shortDescription: true, ctaLink: true },
      take: args.data.limit,
      orderBy: { createdAt: "desc" },
    });
    return { ok: true, items };
  }
  if (name === "get_catalog_item") {
    const args = getCatalogInput.safeParse(parsedJson);
    if (!args.success) return { ok: false, error: "Slug katalog tidak valid." };
    const item = await prisma.catalogItem.findUnique({
      where: { slug: args.data.slug },
      select: { title: true, slug: true, type: true, status: true, description: true, priceType: true, priceLabel: true, ctaText: true, ctaLink: true, curriculumSummary: true, method: true, duration: true },
    });
    return item ? { ok: true, item } : { ok: false, error: "Listing tidak ditemukan." };
  }
  if (name === "get_tutoring_estimate") {
    const args = estimateInput.safeParse(parsedJson);
    if (!args.success) return { ok: false, error: "Parameter estimasi les tidak valid." };
    return { ok: false, available: false, error: "Tutoring pricing API Agent 06 belum tersedia. Jangan memberikan estimasi manual." };
  }
  if (name === "create_tutoring_draft" || name === "create_business_request_draft") {
    const args = draftInput.safeParse(parsedJson);
    if (!args.success) return { ok: false, error: "Draft memerlukan consent eksplisit." };
    const mode = name === "create_tutoring_draft" ? "LEARNING" : "BUSINESS";
    const lead = await prisma.consultationLead.upsert({
      where: { conversationId: context.conversationId },
      create: { conversationId: context.conversationId, userId: context.userId, mode, payload: { draft: true, details: args.data.details } },
      update: { mode, payload: { draft: true, details: args.data.details } },
    });
    return { ok: true, draftId: lead.id, status: "DRAFT" };
  }
  if (name === "create_consultation_summary") {
    const args = summaryInput.safeParse(parsedJson);
    if (!args.success) return { ok: false, error: "Format summary tidak valid." };
    const payload = { ...args.data, generatedAt: new Date().toISOString() };
    const summary = await prisma.consultationSummary.upsert({
      where: { conversationId: context.conversationId },
      create: { conversationId: context.conversationId, payload },
      update: { payload, generatedAt: new Date() },
    });
    return { ok: true, summaryId: summary.id };
  }
  if (name === "request_human_handoff") {
    const args = handoffInput.safeParse(parsedJson);
    if (!args.success) return { ok: false, error: "Handoff memerlukan consent eksplisit dan scope yang valid." };
    const conversation = await prisma.consultationConversation.findUnique({ where: { id: context.conversationId } });
    if (!conversation) return { ok: false, error: "Percakapan tidak ditemukan." };
    const transcript = await prisma.consultationMessage.findMany({ where: { conversationId: context.conversationId }, orderBy: { createdAt: "asc" } });
    const lead = await prisma.consultationLead.upsert({
      where: { conversationId: context.conversationId },
      create: { conversationId: context.conversationId, userId: conversation.userId, mode: conversation.mode, customerName: args.data.customerName, customerEmail: args.data.customerEmail, customerPhone: args.data.customerPhone, payload: { transcript, reason: "AI_ESCALATION_WITH_CONSENT" } },
      update: { customerName: args.data.customerName, customerEmail: args.data.customerEmail, customerPhone: args.data.customerPhone, payload: { transcript, reason: "AI_ESCALATION_WITH_CONSENT" } },
    });
    await prisma.consultationConversation.update({ where: { id: context.conversationId }, data: { status: "PENDING_REVIEW", handoffReason: "AI_ESCALATION_WITH_CONSENT", consentAt: new Date(), consentScope: args.data.consentScope } });
    return { ok: true, leadId: lead.id, status: "PENDING_REVIEW" };
  }
  return { ok: false, error: "Tool tidak diizinkan." };
}
