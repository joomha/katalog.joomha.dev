# Agent 08 — Completion Report

## Status
PARTIAL

## Ringkasan
Implemented the initial AI Consultant backend foundation on the dedicated branch:
- Learning, Business, and General consultant prompts in Indonesian.
- Server-only OpenRouter chat adapter with structured response validation, tool calling, timeout/error normalization, configurable model and optional fallback model.
- Separate OpenRouter embedding adapter.
- Conversation/message persistence, customer history endpoints, rate limiting per conversation, and human-takeover guard.
- Zod-validated allowlisted tools for catalog search/detail, tutoring estimate placeholder, draft confirmation, summary persistence, and handoff confirmation.
- RAG text normalization, chunking, indexing, pgvector retrieval, and role/visibility filtering.
- Explicit customer-originated consent routes for draft creation and human handoff.
- Admin inbox/detail/assignment/reply APIs, including instructor assignment scoping.
- Mock provider and unit tests for prompt boundaries and model-generated consent protections.

No secret/API key was added to source files or commits.

## Files created/changed
- prisma/models/ai-consultation.prisma — Agent 08 Prisma models and pgvector column contract.
- src/modules/ai-consultant/index.ts — public module exports.
- src/modules/ai-consultant/prompts/consultant-prompts.ts — two workflows and safety rules.
- src/modules/ai-consultant/providers/provider.types.ts — provider/tool contracts.
- src/modules/ai-consultant/providers/openrouter.provider.ts — server-side OpenRouter chat and fallback.
- src/modules/ai-consultant/providers/mock.provider.ts — deterministic test provider.
- src/modules/ai-consultant/schemas/consultation.schema.ts — validated chat, summary, and consent input.
- src/modules/ai-consultant/services/consultation.service.ts — conversation persistence, retrieval, tool orchestration, rate limiting.
- src/modules/ai-consultant/services/draft.service.ts — customer-consented draft persistence.
- src/modules/ai-consultant/services/handoff.service.ts — transcript snapshot and consent persistence.
- src/modules/ai-consultant/tools/allowlist.ts — allowlisted catalog, estimate, draft, summary, and handoff tools.
- src/modules/ai-consultant/rag/chunking.ts — normalization and chunking.
- src/modules/ai-consultant/rag/openrouter-embedding.provider.ts — configurable embedding adapter.
- src/modules/ai-consultant/rag/indexing.ts — TXT/Markdown indexing pipeline.
- src/modules/ai-consultant/rag/retrieval.ts — pgvector retrieval and role/visibility filters.
- src/modules/ai-consultant/rag/chunking.test.ts — chunking tests.
- src/modules/ai-consultant/__tests__/consultant-prompts.test.ts — workflow and prompt-injection boundary tests.
- src/modules/ai-consultant/__tests__/tool-consent.test.ts — verifies model-generated consent cannot trigger sensitive actions.
- src/app/api/ai-consultant/messages/route.ts — chat endpoint.
- src/app/api/ai-consultant/conversations/route.ts — customer conversation list.
- src/app/api/ai-consultant/conversations/[id]/route.ts — customer transcript.
- src/app/api/ai-consultant/drafts/route.ts — explicit draft consent endpoint.
- src/app/api/ai-consultant/handoff/route.ts — explicit human handoff endpoint.
- src/app/api/ai-consultant/knowledge/route.ts — admin TXT/Markdown ingestion and document listing.
- src/app/api/ai-consultant/admin/conversations/route.ts — admin/instructor inbox.
- src/app/api/ai-consultant/admin/conversations/[id]/route.ts — full transcript, summary, and assignment endpoint.
- src/app/api/ai-consultant/admin/conversations/[id]/reply/route.ts — human reply/takeover endpoint.
- docs/operations/agent-08-rag-integration.md — integration contract and blockers.

## Commands executed
- Repository and branch audit — PASS (GitHub repository/branch APIs).
- Branch comparison against main — PASS (branch is ahead, not behind).
- GitHub Actions workflow runs — no runs configured/returned for this branch.
- pnpm lint — NOT RUN (repository dependencies are not available in this execution environment).
- pnpm typecheck — NOT RUN (repository dependencies are not available in this execution environment).
- pnpm test — NOT RUN (repository dependencies are not available in this execution environment).
- pnpm build — NOT RUN (repository dependencies are not available in this execution environment).

## Schema / API contracts
- Added ConsultationConversation, ConsultationMessage, ConsultationLead, ConsultationSummary, KnowledgeDocument, and KnowledgeChunk.
- KnowledgeChunk uses Unsupported("vector(1536)") and raw parameterized pgvector operations. Agent 10 must enable the vector extension and generate migration.
- Chat endpoint accepts conversationId or guestSessionId, mode, and message.
- Draft and handoff APIs require consent=true from a customer-originated request; model-generated tool arguments cannot grant consent.
- Admin endpoints are role-gated; instructor access is limited to assigned conversations.
- OpenRouter embedding model and optional chat fallback/timeout/token parameters are configured server-side.

## Known limitations
1. No customer-facing chat UI or public route was added because Agent 03 owns the public shell/route and coordination is required.
2. Streaming responses are not implemented.
3. Knowledge ingestion currently accepts extracted TXT/Markdown text only. PDF/DOCX extraction and durable original-file storage require Agent 09 storage integration and a tested extraction library.
4. Tutoring pricing tool returns unavailable until Agent 06 publishes its public pricing API; no price is fabricated.
5. Tutoring/business drafts currently persist as ConsultationLead records; replace with Agent 06/07 public draft APIs after those contracts are available.
6. Knowledge document deactivate/delete/reindex endpoints and a full admin UI remain outstanding.
7. Notification delivery and audit-log integration require Agent 09.
8. pgvector migration, Prisma generation/validation, cross-domain integration tests, and E2E remain Agent 10 responsibilities.

## Required follow-up from other agents
- Agent 03: agree public route placement and wire the ConsultantChat UI into the public shell.
- Agent 06: expose tutoring estimate and tutoring request draft public contracts.
- Agent 07: expose business request draft public contract.
- Agent 09: connect file storage, PDF/DOCX extraction, notifications, and audit logging.
- Agent 10: enable pgvector, create migration, run Prisma validation/generate, typecheck, lint, unit/integration/E2E tests, and verify clean-database setup.

## Branch / PR
- Branch: agent/08-ai-consultant
- Target: main unless maintainer has activated integration/development.
- PR: pending; do not merge until follow-up contracts and validation gaps above are addressed.
