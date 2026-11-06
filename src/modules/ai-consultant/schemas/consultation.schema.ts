import { z } from "zod";

export const consultationModeSchema = z.enum(["LEARNING", "BUSINESS", "GENERAL"]);
export type ConsultationMode = z.infer<typeof consultationModeSchema>;

export const consultationMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  guestSessionId: z.string().min(16).max(128).optional(),
  mode: consultationModeSchema.default("GENERAL"),
  message: z.string().trim().min(1).max(8_000),
}).refine((value) => Boolean(value.conversationId || value.guestSessionId), {
  message: "conversationId atau guestSessionId wajib diisi.",
});

export const handoffConsentSchema = z.object({
  conversationId: z.string().uuid(),
  guestSessionId: z.string().min(16).max(128).optional(),
  consent: z.literal(true),
  consentScope: z.array(z.enum(["TRANSCRIPT", "CONTACT_DETAILS", "CONSULTATION_SUMMARY"])).min(1),
  customerName: z.string().trim().max(120).optional(),
  customerEmail: z.string().email().max(254).optional(),
  customerPhone: z.string().trim().max(32).optional(),
});

export const consultationSummarySchema = z.object({
  consultationId: z.string().uuid(),
  type: consultationModeSchema,
  customerName: z.string().nullable(),
  customerContact: z.string().nullable(),
  needs: z.string(),
  context: z.string().nullable(),
  currentLevelOrState: z.string().nullable(),
  targetOutcome: z.string().nullable(),
  recommendations: z.array(z.string()),
  curriculumOrScopeDraft: z.array(z.string()),
  methodAndLocation: z.string().nullable(),
  sessionsOrTimeline: z.string().nullable(),
  budget: z.string().nullable(),
  backendEstimates: z.array(z.object({
    label: z.string(),
    amount: z.number().nonnegative(),
    currency: z.literal("IDR"),
    source: z.string(),
  })),
  unansweredQuestions: z.array(z.string()),
  objections: z.array(z.string()),
  handoffReason: z.string().nullable(),
  nextAction: z.string(),
});

export type ConsultationSummary = z.infer<typeof consultationSummarySchema>;
