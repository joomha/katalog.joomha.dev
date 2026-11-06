import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  leadUpsert: vi.fn(),
  handoffUpdate: vi.fn(),
  summaryUpsert: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    catalogItem: { findMany: vi.fn(), findUnique: vi.fn() },
    consultationLead: { upsert: mocks.leadUpsert },
    consultationSummary: { upsert: mocks.summaryUpsert },
    consultationConversation: { findUnique: vi.fn(), update: mocks.handoffUpdate },
    consultationMessage: { findMany: vi.fn() },
  },
}));

import { executeConsultantTool } from "../tools/allowlist";

describe("consultant tool consent boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not create a tutoring draft from model-generated consent", async () => {
    const result = await executeConsultantTool(
      "create_tutoring_draft",
      JSON.stringify({ consent: true, details: { subject: "Python" } }),
      { conversationId: "00000000-0000-4000-8000-000000000001" },
    );
    expect(result).toMatchObject({ ok: true, requiresExplicitConfirmation: true });
    expect(mocks.leadUpsert).not.toHaveBeenCalled();
  });

  it("does not hand off a transcript from model-generated consent", async () => {
    const result = await executeConsultantTool(
      "request_human_handoff",
      JSON.stringify({ consent: true, consentScope: ["TRANSCRIPT"] }),
      { conversationId: "00000000-0000-4000-8000-000000000001" },
    );
    expect(result).toMatchObject({ ok: true, requiresExplicitConfirmation: true });
    expect(mocks.handoffUpdate).not.toHaveBeenCalled();
  });
});
