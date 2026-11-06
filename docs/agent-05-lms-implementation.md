# Agent 05 — LMS implementation notes

## Ownership and integration
- Learning schema lives only in \`prisma/models/learning.prisma\`; Agent 10 owns migrations.
- Catalog linkage uses scalar \`catalogItemId\` and the public Catalog module contract.
- User identity references use scalar UUIDs, not Prisma relations to Identity.
- Server-side permission checks are centralized in \`services/identity.adapter.ts\`.
  This is a temporary bridge because the merged Identity public barrel is currently empty.
  Replace its imports with public-barrel exports when Agent 02 completes that contract.

## Assessment security
- Correct answers live in server-side question/option records.
- Student payloads contain question IDs and answers only.
- Attempt deadline, attempt count and grading are server-authoritative.
- Correct options, answer keys, explanations and manual-review answers are not returned before submission.

## Learning progression
- Pretest is diagnostic unless chapter policy explicitly requires it before lessons.
- Chapter exams unlock the next chapter only after required lessons, posttests, games and assignments pass.
- Final exam is unavailable until required chapters pass.
- Certificate eligibility checks final exam, required assignment state and minimum progress.

## Games
The validated game registry supports Crossword, Multiple Choice, True/False, Matching Pairs,
Word Scramble, Fill in the Blank, Flashcards, Ordering and Timed Challenge. Config is data,
not executable code. No dynamic evaluation is used.

## OrderPaid contract expected by the LMS subscriber
\`\`\`ts
type OrderPaidPayload = {
  orderId: string;
  userId: string; // UUID
  items: Array<{ catalogItemId: string; quantity: number }>;
};
\`\`\`
The LMS creates one idempotent enrollment per paid course item and user/order.
A refund/revocation policy must be agreed with Agent 04 before revoking an existing enrollment.
