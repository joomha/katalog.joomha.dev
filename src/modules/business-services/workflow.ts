import type {
  BusinessProposalRevisionStatus,
  BusinessProposalStatus,
  BusinessRequestStatus,
} from "@prisma/client";

export class BusinessServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "FORBIDDEN" | "INVALID_STATE" | "VALIDATION" | "CONFLICT" = "INVALID_STATE",
  ) {
    super(message);
    this.name = "BusinessServiceError";
  }
}

export function getInitialBusinessRequestStatus(hasServiceSlug: boolean): BusinessRequestStatus {
  return hasServiceSlug ? "NEW" : "NEEDS_DISCOVERY";
}

export function assertProposalCanBeRevised(status: BusinessProposalStatus): void {
  if (["ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"].includes(status)) {
    throw new BusinessServiceError("Proposal yang sudah diputuskan tidak dapat direvisi.", "INVALID_STATE");
  }
}

export function assertProposalCanBeApproved(status: BusinessProposalStatus): void {
  if (status !== "DRAFT") {
    throw new BusinessServiceError("Hanya proposal draft yang dapat disetujui secara internal.", "INVALID_STATE");
  }
}

export function assertProposalCanBeSent(
  proposalStatus: BusinessProposalStatus,
  revisionStatus: BusinessProposalRevisionStatus,
): void {
  if (proposalStatus !== "APPROVED" || revisionStatus !== "APPROVED") {
    throw new BusinessServiceError("Proposal harus disetujui admin/owner sebelum dikirim sebagai penawaran resmi.", "INVALID_STATE");
  }
}

export function assertCustomerCanDecideProposal(input: {
  proposalStatus: BusinessProposalStatus;
  revisionStatus: BusinessProposalRevisionStatus;
  validUntil: Date;
  now?: Date;
}): void {
  const now = input.now ?? new Date();
  if (input.proposalStatus !== "SENT" || input.revisionStatus !== "SENT") {
    throw new BusinessServiceError("Hanya proposal resmi yang sudah dikirim yang dapat disetujui atau ditolak.", "INVALID_STATE");
  }
  if (input.validUntil.getTime() < now.getTime()) {
    throw new BusinessServiceError("Masa berlaku proposal telah berakhir.", "INVALID_STATE");
  }
}

export function assertPaymentTermsMatchTotal(
  terms: readonly { amount: number }[],
  totalAmount: number,
): void {
  if (terms.length === 0 || terms.some((term) => !Number.isFinite(term.amount) || term.amount <= 0)) {
    throw new BusinessServiceError("Termin pembayaran harus memiliki nilai positif.", "VALIDATION");
  }
  const sumInCents = terms.reduce((sum, term) => sum + Math.round(term.amount * 100), 0);
  const totalInCents = Math.round(totalAmount * 100);
  if (sumInCents !== totalInCents) {
    throw new BusinessServiceError("Jumlah seluruh termin harus sama dengan total proposal.", "VALIDATION");
  }
}

export function isCustomerVisibleUpdate(visibility: string): boolean {
  return visibility === "CUSTOMER";
}

export function getRequestStatusAfterProposal(status: BusinessRequestStatus): BusinessRequestStatus {
  return status === "CANCELLED" || status === "CLOSED" ? status : "PROPOSAL_DRAFT";
}
