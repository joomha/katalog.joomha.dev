import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type BusinessProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events";
import { getCatalogItemBySlug } from "@/modules/catalog";
import { assertAuthenticated, assertPermission, getCurrentUser } from "@/modules/identity/guards";
import { AccessDeniedError } from "@/modules/identity/types";
import { PERMISSIONS } from "@/modules/identity/permissions";
import {
  BusinessProposalDraftSchema, BusinessServiceRequestSchema, ProjectDeliverableCreateSchema,
  ProjectDeliverableReviewSchema, ProjectHandoverSchema, ProjectMilestoneUpdateSchema,
  ProjectProgressUpdateSchema, ProposalDecisionSchema,
  type BusinessProposalDraftInput, type CreateBusinessServiceRequestInput,
} from "../schemas/business-service.schema";
import { BUSINESS_SERVICE_DEFINITIONS } from "../data/service-definitions";
import {
  assertCustomerCanDecideProposal, assertPaymentTermsMatchTotal, assertProposalCanBeApproved,
  assertProposalCanBeRevised, assertProposalCanBeSent, BusinessServiceError,
  getInitialBusinessRequestStatus, isCustomerVisibleUpdate,
} from "../workflow";

type RequestSource = "WEBSITE_FORM" | "AI_HANDOFF" | "ADMIN";
type JsonRecord = Record<string, unknown>;
const toJson = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const cleanOptional = (value?: string) => value?.trim() || null;
const makeCode = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;

function publicServiceDetails(catalogItem: NonNullable<Awaited<ReturnType<typeof getCatalogItemBySlug>>>, definition: (typeof BUSINESS_SERVICE_DEFINITIONS)[number]) {
  return {
    slug: definition.slug, title: catalogItem.title, shortDescription: catalogItem.shortDescription,
    description: definition.longDescription, summary: definition.summary,
    problems: definition.customerProblems, targetUsers: definition.targetUsers,
    possibleDeliverables: definition.possibleDeliverables, sampleScope: definition.sampleScope,
    customerPreparation: definition.customerPreparation, pricingFactors: definition.pricingFactors,
    durationFactors: definition.durationFactors, priceType: catalogItem.priceType,
    priceLabel: catalogItem.priceLabel, ctaLabel: definition.ctaLabel,
    ctaLink: `/jasa-digitalisasi/ajukan?layanan=${encodeURIComponent(definition.slug)}`,
    coverImage: catalogItem.primaryCover,
    coverAlt: catalogItem.assets.find((asset) => asset.isPrimary)?.altText ?? `Sampul ${catalogItem.title}`,
    category: catalogItem.category.name,
  };
}

export async function listBusinessServiceDefinitions() {
  const results = await Promise.all(BUSINESS_SERVICE_DEFINITIONS.map(async (definition) => {
    const item = await getCatalogItemBySlug(definition.slug);
    return item?.type === "BUSINESS_SERVICE" ? publicServiceDetails(item, definition) : null;
  }));
  return results.filter((item) => item !== null);
}

export async function getBusinessServiceDefinitionBySlug(slug: string) {
  const definition = BUSINESS_SERVICE_DEFINITIONS.find((item) => item.slug === slug);
  if (!definition) return null;
  const item = await getCatalogItemBySlug(slug);
  return item?.type === "BUSINESS_SERVICE" ? publicServiceDetails(item, definition) : null;
}

async function createRequest(input: CreateBusinessServiceRequestInput, source: RequestSource, consultationLeadId?: string) {
  const parsed = BusinessServiceRequestSchema.parse(input);
  const user = await getCurrentUser();
  if (source === "ADMIN") await assertPermission(PERMISSIONS.BUSINESS_MANAGE);

  let serviceTitleSnapshot: string | null = null;
  if (parsed.serviceSlug) {
    const item = await getCatalogItemBySlug(parsed.serviceSlug);
    if (!item || item.type !== "BUSINESS_SERVICE") {
      throw new BusinessServiceError("Layanan tidak ditemukan di katalog jasa digitalisasi.", "VALIDATION");
    }
    serviceTitleSnapshot = item.title;
  }

  return prisma.businessServiceRequest.create({
    data: {
      userId: user?.id ?? null, serviceSlug: cleanOptional(parsed.serviceSlug),
      serviceTitleSnapshot, status: getInitialBusinessRequestStatus(Boolean(parsed.serviceSlug)),
      source, contactName: parsed.contactName, contactEmail: parsed.contactEmail,
      contactPhone: cleanOptional(parsed.contactPhone), contactConsentAt: new Date(),
      businessName: cleanOptional(parsed.businessName), businessType: cleanOptional(parsed.businessType),
      organizationSize: cleanOptional(parsed.organizationSize), currentProcess: cleanOptional(parsed.currentProcess),
      mainProblem: parsed.mainProblem, workVolume: cleanOptional(parsed.workVolume),
      currentTools: parsed.currentTools, desiredOutcome: parsed.desiredOutcome,
      integrationNeeds: parsed.integrationNeeds, budgetMin: parsed.budgetMin ?? null,
      budgetMax: parsed.budgetMax ?? null, budgetNote: cleanOptional(parsed.budgetNote),
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
      attachments: toJson(parsed.attachments), consultationLeadId: consultationLeadId ?? null,
    },
    select: { id: true, status: true, source: true, serviceSlug: true, createdAt: true },
  });
}

/** Website intake: guest dan customer dapat mengajukan kebutuhan. */
export async function createBusinessServiceRequest(input: CreateBusinessServiceRequestInput) {
  return createRequest(input, "WEBSITE_FORM");
}

/** Server-side handoff contract Agent 08. Hasil AI tetap request draft, bukan proposal resmi. */
export async function createBusinessServiceRequestFromConsultation(input: CreateBusinessServiceRequestInput, leadId: string) {
  if (!leadId.trim()) throw new BusinessServiceError("Referensi lead konsultasi wajib diisi.", "VALIDATION");
  return createRequest(input, "AI_HANDOFF", leadId.trim());
}

export async function createBusinessServiceRequestByAdmin(input: CreateBusinessServiceRequestInput) {
  return createRequest(input, "ADMIN");
}

export async function attachConsultationLeadToServiceRequest(requestId: string, leadId: string) {
  await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  if (!leadId.trim()) throw new BusinessServiceError("ID lead konsultasi wajib diisi.", "VALIDATION");
  const request = await prisma.businessServiceRequest.findUnique({ where: { id: requestId }, select: { id: true } });
  if (!request) throw new BusinessServiceError("Permintaan proyek tidak ditemukan.", "NOT_FOUND");
  return prisma.businessServiceRequest.update({
    where: { id: requestId }, data: { consultationLeadId: leadId.trim() },
    select: { id: true, consultationLeadId: true, updatedAt: true },
  });
}

export async function listCustomerBusinessRequests() {
  const user = await assertAuthenticated();
  return prisma.businessServiceRequest.findMany({
    where: user.emailVerified
      ? { OR: [{ userId: user.id }, { userId: null, contactEmail: { equals: user.email, mode: "insensitive" } }] }
      : { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, serviceSlug: true, serviceTitleSnapshot: true, status: true,
      mainProblem: true, desiredOutcome: true, createdAt: true,
      proposals: {
        orderBy: { createdAt: "desc" }, take: 1,
        select: {
          id: true, proposalCode: true, status: true, currentVersion: true,
          revisions: {
            where: { status: { in: ["SENT", "ACCEPTED", "REJECTED"] } },
            orderBy: { version: "desc" }, take: 1,
            select: {
              id: true, version: true, status: true, title: true, totalAmount: true, currency: true,
              timelineSummary: true, validUntil: true, sentAt: true,
              customerDecisionAt: true, customerFeedback: true,
            },
          },
        },
      },
    },
  });
}

export async function listBusinessRequestsForAdmin() {
  await assertPermission(PERMISSIONS.BUSINESS_VIEW);
  return prisma.businessServiceRequest.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    select: {
      id: true, contactName: true, contactEmail: true, businessName: true,
      serviceSlug: true, serviceTitleSnapshot: true, status: true, source: true,
      assignedToUserId: true, createdAt: true,
      _count: { select: { proposals: true, projects: true } },
    },
  });
}

export async function getBusinessRequestForAdmin(requestId: string) {
  await assertPermission(PERMISSIONS.BUSINESS_VIEW);
  const request = await prisma.businessServiceRequest.findUnique({
    where: { id: requestId },
    include: {
      proposals: { orderBy: { createdAt: "desc" }, include: { revisions: { orderBy: { version: "desc" } } } },
      projects: { select: { id: true, projectCode: true, title: true, status: true } },
    },
  });
  if (!request) throw new BusinessServiceError("Permintaan proyek tidak ditemukan.", "NOT_FOUND");
  return request;
}

function milestonePlan(input: BusinessProposalDraftInput["milestones"]) {
  return [...input].sort((a, b) => a.sequence - b.sequence).map((item) => ({
    title: item.title, description: item.description, sequence: item.sequence,
    targetDate: item.targetDate ?? null, acceptanceCriteria: item.acceptanceCriteria,
  }));
}
function paymentPlan(input: BusinessProposalDraftInput["paymentTerms"]) {
  return [...input].sort((a, b) => a.sequence - b.sequence).map((item) => ({
    label: item.label, description: cleanOptional(item.description),
    sequence: item.sequence, amount: item.amount, dueAt: item.dueAt ?? null,
  }));
}
function proposalRevisionData(parsed: BusinessProposalDraftInput, actorId: string, version: number) {
  return {
    version, status: "DRAFT" as const, title: parsed.title, problemStatement: parsed.problemStatement,
    scopeIn: parsed.scopeIn, scopeOut: parsed.scopeOut, deliverables: parsed.deliverables,
    timelineSummary: parsed.timelineSummary, estimatedDurationDays: parsed.estimatedDurationDays,
    plannedStartAt: parsed.plannedStartAt ? new Date(parsed.plannedStartAt) : null,
    targetCompletionAt: parsed.targetCompletionAt ? new Date(parsed.targetCompletionAt) : null,
    totalAmount: parsed.totalAmount, currency: parsed.currency,
    milestonePlan: toJson(milestonePlan(parsed.milestones)),
    paymentTerms: toJson(paymentPlan(parsed.paymentTerms)),
    assumptions: parsed.assumptions, customerDependencies: parsed.customerDependencies,
    acceptanceCriteria: parsed.acceptanceCriteria, exclusions: parsed.exclusions,
    validUntil: new Date(parsed.validUntil), createdByUserId: actorId,
  };
}

export async function createBusinessProposalDraft(requestId: string, input: BusinessProposalDraftInput) {
  const actor = await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  const parsed = BusinessProposalDraftSchema.parse(input);
  assertPaymentTermsMatchTotal(parsed.paymentTerms, parsed.totalAmount);
  return prisma.$transaction(async (tx) => {
    const request = await tx.businessServiceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new BusinessServiceError("Permintaan proyek tidak ditemukan.", "NOT_FOUND");
    if (["CANCELLED", "CLOSED", "CONVERTED_TO_PROJECT"].includes(request.status)) {
      throw new BusinessServiceError("Permintaan ini tidak lagi dapat menerima proposal.", "INVALID_STATE");
    }
    const proposal = await tx.businessProposal.create({
      data: {
        proposalCode: makeCode("JHP"), requestId, status: "DRAFT",
        currentVersion: 1, createdByUserId: actor.id,
        revisions: { create: proposalRevisionData(parsed, actor.id, 1) },
      },
      include: { revisions: true },
    });
    await tx.businessServiceRequest.update({ where: { id: requestId }, data: { status: "PROPOSAL_DRAFT" } });
    return proposal;
  });
}

export async function reviseBusinessProposal(proposalId: string, input: BusinessProposalDraftInput) {
  const actor = await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  const parsed = BusinessProposalDraftSchema.parse(input);
  assertPaymentTermsMatchTotal(parsed.paymentTerms, parsed.totalAmount);
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.businessProposal.findUnique({
      where: { id: proposalId }, include: { request: true, revisions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!proposal) throw new BusinessServiceError("Proposal tidak ditemukan.", "NOT_FOUND");
    assertProposalCanBeRevised(proposal.status);
    const version = proposal.currentVersion + 1;
    await tx.businessProposalRevision.updateMany({
      where: { proposalId, status: { in: ["DRAFT", "APPROVED", "SENT"] } },
      data: { status: "SUPERSEDED" },
    });
    const revision = await tx.businessProposalRevision.create({
      data: { proposalId, ...proposalRevisionData(parsed, actor.id, version) },
    });
    await tx.businessProposal.update({ where: { id: proposalId }, data: { status: "DRAFT", currentVersion: version } });
    await tx.businessServiceRequest.update({ where: { id: proposal.requestId }, data: { status: "PROPOSAL_DRAFT" } });
    return { proposalId, version, revision };
  });
}

export async function approveBusinessProposalInternally(proposalId: string, revisionId: string) {
  const actor = await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.businessProposal.findUnique({
      where: { id: proposalId }, include: { revisions: { where: { id: revisionId } } },
    });
    if (!proposal || proposal.revisions.length === 0) throw new BusinessServiceError("Proposal atau versi tidak ditemukan.", "NOT_FOUND");
    const revision = proposal.revisions[0];
    if (proposal.currentVersion !== revision.version) throw new BusinessServiceError("Hanya versi proposal terbaru yang dapat disetujui.", "INVALID_STATE");
    assertProposalCanBeApproved(proposal.status);
    const updated = await tx.businessProposalRevision.update({
      where: { id: revisionId }, data: { status: "APPROVED", approvedByUserId: actor.id, approvedAt: new Date() },
    });
    await tx.businessProposal.update({ where: { id: proposalId }, data: { status: "APPROVED" } });
    return updated;
  });
}

export async function sendOfficialBusinessProposal(proposalId: string, revisionId: string) {
  await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.businessProposal.findUnique({
      where: { id: proposalId }, include: { request: true, revisions: { where: { id: revisionId } } },
    });
    if (!proposal || proposal.revisions.length === 0) throw new BusinessServiceError("Proposal atau versi tidak ditemukan.", "NOT_FOUND");
    const revision = proposal.revisions[0];
    assertProposalCanBeSent(proposal.status, revision.status);
    if (proposal.currentVersion !== revision.version) throw new BusinessServiceError("Hanya versi proposal terbaru yang dapat dikirim.", "INVALID_STATE");
    if (revision.validUntil.getTime() <= Date.now()) throw new BusinessServiceError("Masa berlaku proposal sudah lewat.", "INVALID_STATE");
    const updated = await tx.businessProposalRevision.update({ where: { id: revisionId }, data: { status: "SENT", sentAt: new Date() } });
    await tx.businessProposal.update({ where: { id: proposalId }, data: { status: "SENT" } });
    await tx.businessServiceRequest.update({ where: { id: proposal.requestId }, data: { status: "PROPOSAL_SENT" } });
    return updated;
  });
}

function jsonRecords(value: Prisma.JsonValue, description: string): JsonRecord[] {
  if (!Array.isArray(value)) throw new BusinessServiceError(`${description} proposal tidak valid.`, "VALIDATION");
  return value.map((entry) => {
    if (!entry || Array.isArray(entry) || typeof entry !== "object") throw new BusinessServiceError(`${description} proposal tidak valid.`, "VALIDATION");
    return entry as JsonRecord;
  });
}

async function createProjectInTransaction(tx: Prisma.TransactionClient, proposal: {
  id: string; requestId: string; proposalCode: string;
  request: { userId: string | null; assignedToUserId: string | null };
}, revision: {
  id: string; title: string; problemStatement: string; scopeIn: string[]; scopeOut: string[];
  deliverables: string[]; timelineSummary: string; estimatedDurationDays: number;
  plannedStartAt: Date | null; targetCompletionAt: Date | null; totalAmount: Prisma.Decimal;
  currency: string; milestonePlan: Prisma.JsonValue; paymentTerms: Prisma.JsonValue;
  assumptions: string[]; customerDependencies: string[]; acceptanceCriteria: string[];
  exclusions: string[]; version: number;
}) {
  const milestones = jsonRecords(revision.milestonePlan, "Milestone").map((item) => {
    if (typeof item.title !== "string" || typeof item.description !== "string" || typeof item.sequence !== "number") {
      throw new BusinessServiceError("Data milestone proposal tidak lengkap.", "VALIDATION");
    }
    return {
      title: item.title, description: item.description, sequence: item.sequence,
      targetDate: typeof item.targetDate === "string" ? new Date(item.targetDate) : null,
      acceptanceCriteria: Array.isArray(item.acceptanceCriteria) ? item.acceptanceCriteria.filter((v): v is string => typeof v === "string") : [],
    };
  });
  const terms = jsonRecords(revision.paymentTerms, "Termin").map((item) => {
    if (typeof item.label !== "string" || typeof item.sequence !== "number" || typeof item.amount !== "number") {
      throw new BusinessServiceError("Data termin proposal tidak lengkap.", "VALIDATION");
    }
    return {
      label: item.label, description: typeof item.description === "string" ? item.description : null,
      sequence: item.sequence, amount: item.amount,
      dueAt: typeof item.dueAt === "string" ? new Date(item.dueAt) : null,
    };
  });
  assertPaymentTermsMatchTotal(terms, Number(revision.totalAmount));
  return tx.businessProject.create({
    data: {
      projectCode: makeCode("JHP"), requestId: proposal.requestId, proposalId: proposal.id,
      proposalRevisionId: revision.id, customerUserId: proposal.request.userId,
      assignedToUserId: proposal.request.assignedToUserId, title: revision.title,
      summary: revision.problemStatement, status: "PLANNED",
      scopeSnapshot: toJson({
        proposalCode: proposal.proposalCode, version: revision.version,
        scopeIn: revision.scopeIn, scopeOut: revision.scopeOut, deliverables: revision.deliverables,
        timelineSummary: revision.timelineSummary, estimatedDurationDays: revision.estimatedDurationDays,
        assumptions: revision.assumptions, customerDependencies: revision.customerDependencies,
        acceptanceCriteria: revision.acceptanceCriteria, exclusions: revision.exclusions,
      }),
      totalAmount: revision.totalAmount, currency: revision.currency,
      plannedStartAt: revision.plannedStartAt, targetCompletionAt: revision.targetCompletionAt,
      milestones: { create: milestones },
      paymentTerms: { create: terms.map((term) => ({ ...term, currency: revision.currency, status: "PLANNED" })) },
    },
    include: { milestones: { orderBy: { sequence: "asc" } }, paymentTerms: { orderBy: { sequence: "asc" } } },
  });
}

/** Customer decisions apply only to the current official revision; acceptance converts atomically. */
export async function decideBusinessProposal(proposalId: string, revisionId: string, input: unknown) {
  const actor = await assertAuthenticated();
  const parsed = ProposalDecisionSchema.parse(input);
  const result = await prisma.$transaction(async (tx) => {
    const proposal = await tx.businessProposal.findUnique({
      where: { id: proposalId }, include: { request: true, revisions: { where: { id: revisionId } } },
    });
    if (!proposal || proposal.revisions.length === 0) throw new BusinessServiceError("Proposal tidak ditemukan.", "NOT_FOUND");
    const isOwner = proposal.request.userId === actor.id;
    const verifiedGuestOwner = proposal.request.userId === null
      && actor.emailVerified
      && proposal.request.contactEmail.toLowerCase() === actor.email.toLowerCase();
    if (!isOwner && !verifiedGuestOwner) {
      throw new BusinessServiceError("Proposal hanya dapat diputuskan oleh pemilik permintaan atau akun terverifikasi dengan email yang sama.", "FORBIDDEN");
    }
    const revision = proposal.revisions[0];
    if (proposal.currentVersion !== revision.version) throw new BusinessServiceError("Versi proposal ini bukan versi yang berlaku.", "INVALID_STATE");
    assertCustomerCanDecideProposal({ proposalStatus: proposal.status, revisionStatus: revision.status, validUntil: revision.validUntil });
    const accepted = parsed.decision === "ACCEPT";
    const now = new Date();
    const updatedRevision = await tx.businessProposalRevision.update({
      where: { id: revisionId },
      data: { status: accepted ? "ACCEPTED" : "REJECTED", customerDecisionAt: now, customerFeedback: cleanOptional(parsed.feedback) },
    });
    await tx.businessProposal.update({
      where: { id: proposalId },
      data: accepted ? { status: "ACCEPTED", acceptedAt: now } : { status: "REJECTED", rejectedAt: now, rejectionReason: cleanOptional(parsed.feedback) },
    });
    const projectProposal = verifiedGuestOwner
      ? { ...proposal, request: { ...proposal.request, userId: actor.id } }
      : proposal;
    const project = accepted ? await createProjectInTransaction(tx, projectProposal, revision) : null;
    if (accepted) await tx.businessServiceRequest.update({
      where: { id: proposal.requestId },
      data: {
        status: "CONVERTED_TO_PROJECT",
        ...(verifiedGuestOwner ? { userId: actor.id } : {}),
      },
    });
    return { accepted, revision: updatedRevision, project, proposal };
  });

  if (result.project) {
    await eventBus.publish("BusinessProposalApproved", {
      proposalId, proposalRevisionId: revisionId, requestId: result.proposal.requestId,
      projectId: result.project.id, projectCode: result.project.projectCode,
      customerUserId: actor.id, currency: result.project.currency,
      paymentTerms: result.project.paymentTerms.map((term) => ({
        paymentTermId: term.id, sequence: term.sequence, label: term.label,
        amount: Number(term.amount), currency: term.currency, dueAt: term.dueAt?.toISOString() ?? null,
      })),
    }, result.project.id);
  }
  return result;
}

const customerProjectInclude = {
  milestones: { orderBy: { sequence: "asc" as const } },
  deliverables: { orderBy: { createdAt: "desc" as const } },
  paymentTerms: { orderBy: { sequence: "asc" as const } },
  updates: { where: { visibility: "CUSTOMER" as const }, orderBy: { createdAt: "desc" as const }, take: 50 },
};

function toCustomerProject(project: {
  id: string; projectCode: string; title: string; summary: string; status: string;
  totalAmount: Prisma.Decimal; currency: string; plannedStartAt: Date | null;
  targetCompletionAt: Date | null; completedAt: Date | null; handoverSummary: string | null;
  handoverConfirmedAt: Date | null;
  milestones: Array<{ id: string; title: string; description: string; sequence: number; targetDate: Date | null; status: string; progress: number; acceptanceCriteria: string[] }>;
  deliverables: Array<{ id: string; milestoneId: string | null; title: string; description: string; type: string; fileName: string | null; externalUrl: string | null; version: number; reviewStatus: string; reviewedAt: Date | null; feedback: string | null; createdAt: Date }>;
  paymentTerms: Array<{ id: string; sequence: number; label: string; description: string | null; amount: Prisma.Decimal; currency: string; dueAt: Date | null; status: string; paidAt: Date | null }>;
  updates: Array<{ id: string; message: string; progress: number | null; createdAt: Date }>;
}) {
  return {
    id: project.id, projectCode: project.projectCode, title: project.title, summary: project.summary,
    status: project.status, totalAmount: Number(project.totalAmount), currency: project.currency,
    plannedStartAt: project.plannedStartAt, targetCompletionAt: project.targetCompletionAt,
    completedAt: project.completedAt, handoverSummary: project.handoverSummary,
    handoverConfirmedAt: project.handoverConfirmedAt,
    milestones: project.milestones.map((item) => ({
      id: item.id, title: item.title, description: item.description, sequence: item.sequence,
      targetDate: item.targetDate, status: item.status, progress: item.progress, acceptanceCriteria: item.acceptanceCriteria,
    })),
    deliverables: project.deliverables.map((item) => ({
      id: item.id, milestoneId: item.milestoneId, title: item.title, description: item.description,
      type: item.type, fileName: item.fileName, externalUrl: item.externalUrl,
      version: item.version, reviewStatus: item.reviewStatus, reviewedAt: item.reviewedAt,
      feedback: item.feedback, createdAt: item.createdAt,
    })),
    paymentTerms: project.paymentTerms.map((term) => ({
      id: term.id, sequence: term.sequence, label: term.label, description: term.description,
      amount: Number(term.amount), currency: term.currency, dueAt: term.dueAt, status: term.status, paidAt: term.paidAt,
    })),
    updates: project.updates.map((update) => ({
      id: update.id, message: update.message, progress: update.progress, createdAt: update.createdAt,
    })),
  };
}
export async function listCustomerBusinessProjects() {
  const actor = await assertAuthenticated();
  const projects = await prisma.businessProject.findMany({
    where: { customerUserId: actor.id }, orderBy: { updatedAt: "desc" }, include: customerProjectInclude,
  });
  return projects.map(toCustomerProject);
}

export async function getCustomerBusinessProjectProgress(projectId: string) {
  const actor = await assertAuthenticated();
  const project = await prisma.businessProject.findFirst({
    where: { id: projectId, customerUserId: actor.id }, include: customerProjectInclude,
  });
  if (!project) throw new BusinessServiceError("Proyek tidak ditemukan.", "NOT_FOUND");
  return toCustomerProject(project);
}

export async function getBusinessProjectForAdmin(projectId: string) {
  await assertPermission(PERMISSIONS.BUSINESS_VIEW);
  const project = await prisma.businessProject.findUnique({
    where: { id: projectId },
    include: {
      ...customerProjectInclude,
      request: { select: { contactName: true, contactEmail: true, contactPhone: true, businessName: true, internalNotes: true } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) throw new BusinessServiceError("Proyek tidak ditemukan.", "NOT_FOUND");
  return project;
}

export async function updateProjectMilestone(milestoneId: string, input: unknown) {
  const actor = await assertAuthenticated();
  const parsed = ProjectMilestoneUpdateSchema.parse(input);
  const milestone = await prisma.projectMilestone.findUnique({
    where: { id: milestoneId }, include: { project: { select: { id: true, customerUserId: true } } },
  });
  if (!milestone) throw new BusinessServiceError("Milestone tidak ditemukan.", "NOT_FOUND");
  let isManager = false;
  try {
    await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
    isManager = true;
  } catch (error) {
    if (!(error instanceof AccessDeniedError)) throw error;
  }
  if (!isManager && milestone.project.customerUserId !== actor.id) {
    throw new BusinessServiceError("Anda tidak memiliki akses ke milestone ini.", "FORBIDDEN");
  }
  if (!isManager && (milestone.status !== "REVIEW" || !parsed.status || !["ACCEPTED", "CHANGES_REQUESTED"].includes(parsed.status))) {
    throw new BusinessServiceError("Pelanggan hanya dapat menyetujui milestone review atau meminta perubahan.", "FORBIDDEN");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(parsed.status ? { status: parsed.status } : {}),
        ...(parsed.progress !== undefined ? { progress: parsed.progress } : {}),
        ...(parsed.customerFeedback !== undefined ? { customerFeedback: cleanOptional(parsed.customerFeedback) } : {}),
        ...(parsed.status === "COMPLETED" || parsed.status === "ACCEPTED" ? { completedAt: new Date() } : {}),
      },
    });
    await tx.projectProgressUpdate.create({
      data: {
        projectId: milestone.project.id, authorId: actor.id, visibility: "CUSTOMER",
        message: `${isManager ? "Pembaruan milestone" : "Tanggapan pelanggan"}: ${row.title} — ${row.status.toLowerCase().replace(/_/g, " ")}.`,
        progress: row.progress,
      },
    });
    return row;
  });
  await eventBus.publish("ProjectMilestoneUpdated", {
    projectId: milestone.project.id, milestoneId: updated.id, title: updated.title,
    status: updated.status, progress: updated.progress,
  }, milestone.project.id);
  return updated;
}

export async function createProjectDeliverable(projectId: string, input: unknown) {
  const actor = await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  const parsed = ProjectDeliverableCreateSchema.parse(input);
  if (parsed.type === "FILE") {
    throw new BusinessServiceError("Upload file akan tersedia setelah adapter storage Agent 09 terintegrasi. Sementara gunakan tautan file yang aksesnya telah diatur.", "INVALID_STATE");
  }
  const project = await prisma.businessProject.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new BusinessServiceError("Proyek tidak ditemukan.", "NOT_FOUND");
  if (parsed.milestoneId) {
    const milestone = await prisma.projectMilestone.findFirst({ where: { id: parsed.milestoneId, projectId }, select: { id: true } });
    if (!milestone) throw new BusinessServiceError("Milestone tidak sesuai dengan proyek.", "VALIDATION");
  }
  return prisma.projectDeliverable.create({
    data: {
      projectId, milestoneId: parsed.milestoneId ?? null, title: parsed.title,
      description: parsed.description, type: parsed.type,
      externalUrl: parsed.type === "LINK" ? parsed.externalUrl : null,
      uploadedByUserId: actor.id, reviewStatus: "PENDING_REVIEW",
    },
  });
}

export async function reviewProjectDeliverable(deliverableId: string, input: unknown) {
  const actor = await assertAuthenticated();
  const parsed = ProjectDeliverableReviewSchema.parse(input);
  const deliverable = await prisma.projectDeliverable.findUnique({
    where: { id: deliverableId }, include: { project: { select: { id: true, customerUserId: true } } },
  });
  if (!deliverable) throw new BusinessServiceError("Deliverable tidak ditemukan.", "NOT_FOUND");
  if (deliverable.project.customerUserId !== actor.id) throw new BusinessServiceError("Anda tidak memiliki akses ke deliverable ini.", "FORBIDDEN");
  if (deliverable.reviewStatus !== "PENDING_REVIEW") throw new BusinessServiceError("Deliverable ini sudah ditinjau.", "INVALID_STATE");
  const result = await prisma.projectDeliverable.update({
    where: { id: deliverableId },
    data: { reviewStatus: parsed.decision, reviewerUserId: actor.id, reviewedAt: new Date(), feedback: cleanOptional(parsed.feedback) },
  });
  await eventBus.publish("ProjectMilestoneUpdated", { projectId: deliverable.project.id, deliverableId, reviewStatus: result.reviewStatus }, deliverable.project.id);
  return result;
}

export async function addProjectProgressUpdate(projectId: string, input: unknown) {
  const actor = await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  const parsed = ProjectProgressUpdateSchema.parse(input);
  const project = await prisma.businessProject.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new BusinessServiceError("Proyek tidak ditemukan.", "NOT_FOUND");
  const update = await prisma.projectProgressUpdate.create({
    data: { projectId, authorId: actor.id, visibility: parsed.visibility, message: parsed.message, progress: parsed.progress ?? null },
  });
  if (isCustomerVisibleUpdate(update.visibility)) {
    await eventBus.publish("ProjectMilestoneUpdated", { projectId, progressUpdateId: update.id, message: update.message, progress: update.progress }, projectId);
  }
  return update;
}

export async function initiateProjectHandover(projectId: string, input: unknown) {
  const actor = await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  const parsed = ProjectHandoverSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const project = await tx.businessProject.findUnique({ where: { id: projectId } });
    if (!project) throw new BusinessServiceError("Proyek tidak ditemukan.", "NOT_FOUND");
    if (["COMPLETED", "CANCELLED"].includes(project.status)) throw new BusinessServiceError("Proyek selesai/dibatalkan tidak dapat masuk review.", "INVALID_STATE");
    const updated = await tx.businessProject.update({
      where: { id: projectId },
      data: { status: "REVIEW", handoverSummary: parsed.handoverSummary, handoverConfirmedAt: null, handoverConfirmedByUserId: null },
    });
    await tx.projectProgressUpdate.create({
      data: { projectId, authorId: actor.id, visibility: "CUSTOMER", message: "Pengerjaan diajukan untuk ditinjau pada tahap serah terima." },
    });
    return updated;
  });
}

export async function confirmProjectHandover(projectId: string) {
  const actor = await assertAuthenticated();
  const updated = await prisma.$transaction(async (tx) => {
    const project = await tx.businessProject.findUnique({ where: { id: projectId } });
    if (!project) throw new BusinessServiceError("Proyek tidak ditemukan.", "NOT_FOUND");
    if (project.customerUserId !== actor.id) throw new BusinessServiceError("Anda tidak memiliki akses ke proyek ini.", "FORBIDDEN");
    if (project.status !== "REVIEW" || !project.handoverSummary) throw new BusinessServiceError("Serah terima belum diajukan oleh tim Joomha.", "INVALID_STATE");
    const now = new Date();
    const result = await tx.businessProject.update({
      where: { id: projectId },
      data: { status: "COMPLETED", completedAt: now, handoverConfirmedAt: now, handoverConfirmedByUserId: actor.id },
    });
    await tx.projectProgressUpdate.create({
      data: { projectId, authorId: actor.id, visibility: "CUSTOMER", message: "Pelanggan mengonfirmasi serah terima proyek. Proyek selesai.", progress: 100 },
    });
    return result;
  });
  await eventBus.publish("ProjectMilestoneUpdated", { projectId, projectStatus: "COMPLETED" }, projectId);
  return updated;
}

/** Recovery contract: create a project when a proposal was accepted but conversion was interrupted. */
export async function createBusinessProjectFromAcceptedProposal(proposalId: string) {
  await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  const outcome = await prisma.$transaction(async (tx) => {
    const proposal = await tx.businessProposal.findUnique({
      where: { id: proposalId },
      include: { request: true, revisions: { where: { status: "ACCEPTED" }, orderBy: { version: "desc" }, take: 1 }, project: { include: { paymentTerms: { orderBy: { sequence: "asc" } } } } },
    });
    if (!proposal) throw new BusinessServiceError("Proposal tidak ditemukan.", "NOT_FOUND");
    if (proposal.project) return { project: proposal.project, created: false, proposal };
    if (proposal.status !== "ACCEPTED" || proposal.revisions.length === 0) {
      throw new BusinessServiceError("Hanya proposal yang telah diterima customer yang dapat dibuat menjadi proyek.", "INVALID_STATE");
    }
    const project = await createProjectInTransaction(tx, proposal, proposal.revisions[0]);
    await tx.businessServiceRequest.update({ where: { id: proposal.requestId }, data: { status: "CONVERTED_TO_PROJECT" } });
    return { project, created: true, proposal };
  });
  if (outcome.created) {
    await eventBus.publish("BusinessProposalApproved", {
      proposalId, proposalRevisionId: outcome.project.proposalRevisionId,
      requestId: outcome.proposal.requestId, projectId: outcome.project.id,
      projectCode: outcome.project.projectCode, customerUserId: outcome.project.customerUserId,
      currency: outcome.project.currency,
      paymentTerms: outcome.project.paymentTerms.map((term: { id: string; sequence: number; label: string; amount: unknown; currency: string; dueAt?: Date | null }) => ({
        paymentTermId: term.id, sequence: term.sequence, label: term.label,
        amount: Number(term.amount), currency: term.currency, dueAt: term.dueAt?.toISOString() ?? null,
      })),
    }, outcome.project.id);
  }
  return outcome.project;
}

export async function updateBusinessProjectStatus(projectId: string, status: BusinessProjectStatus) {
  await assertPermission(PERMISSIONS.BUSINESS_MANAGE);
  if (!["PLANNED", "IN_PROGRESS", "ON_HOLD", "REVIEW", "COMPLETED", "CANCELLED"].includes(status)) {
    throw new BusinessServiceError("Status proyek tidak dikenal.", "VALIDATION");
  }
  return prisma.businessProject.update({ where: { id: projectId }, data: { status } });
}
