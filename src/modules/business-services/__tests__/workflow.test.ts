import { describe, expect, it } from "vitest";
import { BUSINESS_SERVICE_DEFINITIONS } from "../data/service-definitions";
import {
  assertCustomerCanDecideProposal, assertPaymentTermsMatchTotal, assertProposalCanBeApproved,
  assertProposalCanBeRevised, assertProposalCanBeSent, getInitialBusinessRequestStatus,
  isCustomerVisibleUpdate,
} from "../workflow";

describe("business service definitions", () => {
  it("contains fifteen complete service entries with unique stable slugs", () => {
    expect(BUSINESS_SERVICE_DEFINITIONS).toHaveLength(15);
    expect(new Set(BUSINESS_SERVICE_DEFINITIONS.map((item) => item.slug)).size).toBe(15);
    for (const item of BUSINESS_SERVICE_DEFINITIONS) {
      expect(item.summary.length).toBeGreaterThan(30);
      expect(item.longDescription.length).toBeGreaterThan(100);
      for (const field of [item.customerProblems, item.targetUsers, item.possibleDeliverables, item.sampleScope, item.customerPreparation, item.pricingFactors, item.durationFactors]) {
        expect(field.length).toBeGreaterThan(0);
      }
      expect(["Konsultasikan", "Ajukan Proyek"]).toContain(item.ctaLabel);
    }
  });
});

describe("business request and proposal transitions", () => {
  it("sets discovery status when no catalog service has been selected", () => {
    expect(getInitialBusinessRequestStatus(false)).toBe("NEEDS_DISCOVERY");
    expect(getInitialBusinessRequestStatus(true)).toBe("NEW");
  });
  it("only allows internal approval for a draft", () => {
    expect(() => assertProposalCanBeApproved("DRAFT")).not.toThrow();
    expect(() => assertProposalCanBeApproved("SENT")).toThrow();
  });
  it("requires approval before official sending", () => {
    expect(() => assertProposalCanBeSent("APPROVED", "APPROVED")).not.toThrow();
    expect(() => assertProposalCanBeSent("DRAFT", "DRAFT")).toThrow();
  });
  it("locks accepted and rejected proposal versions from editing", () => {
    expect(() => assertProposalCanBeRevised("DRAFT")).not.toThrow();
    expect(() => assertProposalCanBeRevised("ACCEPTED")).toThrow();
    expect(() => assertProposalCanBeRevised("REJECTED")).toThrow();
  });
  it("only allows customer decision for an unexpired official version", () => {
    const future = new Date(Date.now() + 60_000);
    expect(() => assertCustomerCanDecideProposal({ proposalStatus: "SENT", revisionStatus: "SENT", validUntil: future })).not.toThrow();
    expect(() => assertCustomerCanDecideProposal({ proposalStatus: "DRAFT", revisionStatus: "DRAFT", validUntil: future })).toThrow();
    expect(() => assertCustomerCanDecideProposal({ proposalStatus: "SENT", revisionStatus: "SENT", validUntil: new Date(Date.now() - 60_000) })).toThrow();
  });
  it("requires payment terms to equal the agreed proposal amount", () => {
    expect(() => assertPaymentTermsMatchTotal([{ amount: 60 }, { amount: 40 }], 100)).not.toThrow();
    expect(() => assertPaymentTermsMatchTotal([{ amount: 60 }, { amount: 30 }], 100)).toThrow();
    expect(() => assertPaymentTermsMatchTotal([], 0)).toThrow();
  });
  it("keeps internal updates out of customer timelines", () => {
    expect(isCustomerVisibleUpdate("CUSTOMER")).toBe(true);
    expect(isCustomerVisibleUpdate("INTERNAL")).toBe(false);
  });
});
