import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const stringList = z.array(z.string().trim().min(1).max(240)).max(40).default([]);
const dateText = z.string().datetime({ offset: true }).optional();

export const BusinessServiceRequestSchema = z.object({
  serviceSlug: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  contactPhone: optionalText(40),
  contactConsent: z.literal(true),
  businessName: optionalText(160),
  businessType: optionalText(120),
  organizationSize: optionalText(80),
  currentProcess: optionalText(8000),
  mainProblem: z.string().trim().min(8).max(8000),
  workVolume: optionalText(500),
  currentTools: stringList,
  desiredOutcome: z.string().trim().min(8).max(8000),
  integrationNeeds: stringList,
  budgetMin: z.number().finite().nonnegative().max(999_999_999_999.99).optional(),
  budgetMax: z.number().finite().nonnegative().max(999_999_999_999.99).optional(),
  budgetNote: optionalText(2000),
  targetDate: dateText,
  attachments: z.array(z.object({
    name: z.string().trim().min(1).max(180),
    mimeType: z.enum([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
    sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
    storageKey: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9/_-]{0,179}$/).refine((value) => !value.includes("..") && !value.includes("\\")),
  })).max(5).default([]),
}).superRefine((value, context) => {
  if (value.budgetMin !== undefined && value.budgetMax !== undefined && value.budgetMin > value.budgetMax) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["budgetMax"], message: "Batas anggaran maksimum harus sama atau lebih besar dari minimum." });
  }
});

const proposalMilestoneSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(2000),
  sequence: z.number().int().positive(),
  targetDate: dateText,
  acceptanceCriteria: stringList,
});

const proposalPaymentTermSchema = z.object({
  label: z.string().trim().min(2).max(120),
  description: optionalText(500),
  sequence: z.number().int().positive(),
  amount: z.number().finite().positive().max(999_999_999_999.99),
  dueAt: dateText,
});

export const BusinessProposalDraftSchema = z.object({
  title: z.string().trim().min(4).max(180),
  problemStatement: z.string().trim().min(8).max(8000),
  scopeIn: stringList,
  scopeOut: stringList,
  deliverables: stringList,
  timelineSummary: z.string().trim().min(3).max(500),
  estimatedDurationDays: z.number().int().positive().max(3650),
  plannedStartAt: dateText,
  targetCompletionAt: dateText,
  totalAmount: z.number().finite().positive().max(999_999_999_999.99),
  currency: z.string().trim().length(3).default("IDR"),
  milestones: z.array(proposalMilestoneSchema).min(1).max(40),
  paymentTerms: z.array(proposalPaymentTermSchema).min(1).max(20),
  assumptions: stringList,
  customerDependencies: stringList,
  acceptanceCriteria: stringList,
  exclusions: stringList,
  validUntil: z.string().datetime({ offset: true }),
}).superRefine((value, context) => {
  if (value.scopeIn.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scopeIn"], message: "Minimal satu ruang lingkup yang termasuk harus dicantumkan." });
  }
  if (value.deliverables.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["deliverables"], message: "Minimal satu deliverable harus dicantumkan." });
  }
  if (value.acceptanceCriteria.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["acceptanceCriteria"], message: "Kriteria penerimaan wajib dicantumkan." });
  }
  const sequences = value.milestones.map((item) => item.sequence);
  if (new Set(sequences).size !== sequences.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["milestones"], message: "Nomor milestone tidak boleh duplikat." });
  }
  const paymentSequences = value.paymentTerms.map((item) => item.sequence);
  if (new Set(paymentSequences).size !== paymentSequences.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentTerms"], message: "Urutan termin tidak boleh duplikat." });
  }
  const sum = value.paymentTerms.reduce((total, term) => total + term.amount, 0);
  if (Math.abs(sum - value.totalAmount) > 0.01) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentTerms"], message: "Jumlah seluruh termin harus sama dengan total proposal." });
  }
  if (Date.parse(value.validUntil) <= Date.now()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["validUntil"], message: "Masa berlaku proposal harus berada di masa depan." });
  }
});

export const ProposalDecisionSchema = z.object({
  decision: z.enum(["ACCEPT", "REJECT"]),
  feedback: optionalText(4000),
});

export const ProjectMilestoneUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "ACCEPTED", "CHANGES_REQUESTED", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  customerFeedback: optionalText(4000),
}).refine((value) => Object.keys(value).length > 0, "Setidaknya satu field harus diubah.");

export const ProjectDeliverableCreateSchema = z.object({
  milestoneId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(3).max(4000),
  type: z.enum(["FILE", "LINK", "DESCRIPTION"]),
  fileName: optionalText(180),
  storageKey: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9/_-]{0,179}$/).refine((value) => !value.includes("..") && !value.includes("\\")).optional(),
  externalUrl: z.string().url().max(2000).refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Tautan harus menggunakan HTTP atau HTTPS.").optional(),
}).superRefine((value, context) => {
  if (value.type === "FILE" && (!value.fileName || !value.storageKey)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["storageKey"], message: "File memerlukan nama file dan storage key yang telah divalidasi." });
  }
  if (value.type === "LINK" && !value.externalUrl) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["externalUrl"], message: "Tautan wajib diisi untuk deliverable tipe LINK." });
  }
});

export const ProjectDeliverableReviewSchema = z.object({
  decision: z.enum(["ACCEPTED", "CHANGES_REQUESTED", "REJECTED"]),
  feedback: optionalText(4000),
});

export const ProjectProgressUpdateSchema = z.object({
  message: z.string().trim().min(3).max(4000),
  visibility: z.enum(["CUSTOMER", "INTERNAL"]).default("CUSTOMER"),
  progress: z.number().int().min(0).max(100).optional(),
});

export const ProjectHandoverSchema = z.object({
  handoverSummary: z.string().trim().min(10).max(8000),
});

export type CreateBusinessServiceRequestInput = z.infer<typeof BusinessServiceRequestSchema>;
export type BusinessProposalDraftInput = z.infer<typeof BusinessProposalDraftSchema>;
