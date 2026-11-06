# Agent 08 — Integration Notes

## Implemented boundaries
- OpenRouter chat and embedding calls are server-only.
- Model tool arguments are validated with Zod and tool names are allowlisted.
- Model-generated consent flags are never treated as proof of customer consent. Draft creation and human handoff require separate customer-originated API requests.
- Conversation history is owner-scoped for authenticated users; guest sessions are scoped by an unguessable session token.
- RAG retrieval filters indexed documents by visibility and role.

## Current integration blockers
1. RAG upload currently accepts extracted TXT/Markdown text. PDF/DOCX extraction and durable original-file storage must be connected to Agent 09's storage adapter and a tested extraction library.
2. get_tutoring_estimate intentionally returns unavailable until Agent 06 exposes its public pricing contract. No price is fabricated.
3. Tutoring/business draft records are stored as AI consultation leads until Agent 06/07 public draft APIs are available. Replace the local adapter through those public contracts after they merge.
4. Agent 10 must create the migration, enable the PostgreSQL vector extension, and validate the vector(1536) column. Do not run migrations from this branch.
5. Admin knowledge endpoint is JSON text ingestion only; UI, reindex/deactivate endpoints, notifications, and audit-log integration remain to be completed.

## Environment
The shared server environment already defines OPENROUTER_API_KEY, OPENROUTER_BASE_URL, and OPENROUTER_DEFAULT_MODEL. Optional Agent 08 overrides are read server-side:
- OPENROUTER_EMBEDDING_MODEL
- OPENROUTER_TIMEOUT_MS
- OPENROUTER_TEMPERATURE
- OPENROUTER_MAX_TOKENS

No secret values belong in this document or in source control.
