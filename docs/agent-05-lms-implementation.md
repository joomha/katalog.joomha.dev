# Agent 05 — LMS Engine

## Scope implemented on \`agent/05-lms-engine\`

Agent 05 owns the learning schema, learning domain module, LMS student/admin routes, learning seed and domain unit tests. Database migration and cross-domain integration/E2E remain Agent 10 responsibilities.

### Domain model
- Course is linked to one \`CatalogItem\` through unique scalar \`catalogItemId\`; the public catalog listing remains owned by Agent 03.
- Curriculum: chapter, lesson, content blocks (text/video/image/file/code/embed/link/practice).
- Enrollment, lesson/content progress, assessment definitions/questions/options/attempts/answers.
- Nine game types and game attempts.
- Assignments, submissions, instructor grading, and certificate records.
- Cross-domain User, CatalogItem and Order IDs remain scalar references; no ownership-crossing Prisma relations were introduced.

### Server-side behavior
- Publishing requires an AVAILABLE SELF_PACED_COURSE CatalogItem, published required chapters/lessons, required content blocks, chapter exams when configured, and a final exam when required for a certificate.
- Student course/player reads require an active or completed entitlement with an unexpired access window.
- Lesson completion requires required content blocks to be marked viewed and required posttests to have a passing attempt.
- Chapter gates require configured pretest, all required lessons, posttests, games, assignments and chapter exam.
- Final exam and certificate eligibility are recalculated from persisted state on the server.
- Assessment attempt policy enforces maximum attempts, active attempt checks, retry cooldown and deadline. Scoring uses DB-held answer keys.
- Public assessment/game serializers strip the correctness metadata and answer maps. Game configs use a Zod discriminated union and do not execute source code.
- Paid enrollment consumes an OrderPaid event and creates enrollment idempotently per course and user.
- Certificate issuance checks completed enrollment and course requirements, stores a unique certificate/verification code and snapshots, and exposes a public verifier/PDF route.

### Student routes/components
- \`/kursus\` and \`/kursus/[slug]\`: public course discovery and curriculum.
- \`/akun/pembelajaran\`: student course dashboard.
- \`/akun/pembelajaran/[slug]\`: course player, chapter gates, content progress, assessment/game runners, assignment submission, completion and certificate link.
- \`/akun/sertifikat\`: certificate list.
- \`/verifikasi-sertifikat/[code]\`: public verification.
- \`/api/learning/certificates/[code]/pdf\`: generated PDF for an issued certificate.

### Admin routes/components
- \`/admin/learning\`: learning dashboard.
- \`/admin/learning/baru\`: create a course from a SELF_PACED_COURSE catalog listing.
- \`/admin/learning/[slug]\`: chapter/lesson/content authoring, assessment/game/assignment JSON authoring, publish validation.
- \`/admin/learning/tugas\`: review and grade student submissions.
- Legacy \`/admin/pembelajaran\` redirects to \`/admin/learning\`.

All privileged authoring and grading services require the Identity module's \`learning.manage\` permission. Student operations derive the user from the authenticated server session and verify ownership/enrollment in the database.

### Seed
\`prisma/seeds/learning.seed.ts\`:
- Creates Course records for every SELF_PACED_COURSE catalog item (15 expected from Agent 03 seed).
- Produces unpublished outline skeletons from curriculum summaries for non-demo courses.
- Seeds Microsoft Excel Basic as a complete draft demo: 3 chapters, 9 substantive lessons/text blocks, optional diagnostic pretest, per-lesson posttests, 3 chapter exams, final exam, nine supported games (including required TTS and multiple choice), and a required practical assignment.
- It intentionally does not change CatalogItem status or publish the Course. Owner/Agent 03 must make the catalog listing AVAILABLE before Course publish.
- Seed is not run by Agent 05; Agent 10 must run it after applying migration.

### Unit tests added
- Assessment grading, optional/manual-review questions, attempts/cooldown/deadline, shuffle immutability.
- Chapter/final exam/certificate progression.
- All nine game config variants, answer-key redaction and timed challenge expiry.
- Content-block and assignment-submission Zod validation.
- Certificate PDF document generation.

## Cross-domain contracts and required follow-up

1. **Agent 04 / Agent 10 — OrderPaid:** current LMS adapter expects \`{ orderId, userId, items: [{ catalogItemId, quantity? }] }\`. Confirm/adjust the final payment event shape and call \`registerLearningOrderPaidHandler()\` during integration bootstrap.
2. **Agent 09 — file storage:** private file content and assignment attachment upload need the final StoredFile/private storage adapter. No direct public file URL is intentionally exposed by the player.
3. **Agent 09 — notifications:** subscribe to \`CourseCompleted\` and \`CertificateIssued\`.
4. **Agent 10 — database:** generate/apply migration from \`prisma/models/learning.prisma\`; run learning seed after catalog seed; add purchase → enrollment → learning → exam → certificate E2E.
5. **Agent 02 — Identity public barrel:** domain code imports the existing guard/permission modules directly because \`src/modules/identity/index.ts\` was still a stub when this branch was prepared. Re-exporting from Identity's public entry point can be coordinated without changing LMS behavior.

## Known limitations / verification status

- No local checkout/Node/pnpm environment was available through the GitHub connector; lint, typecheck, Vitest, build, database migration and E2E have not been executed by Agent 05. Do not treat this report as evidence that those commands pass.
- Actual private file upload/download storage is not activated; the schema and validation support private storage keys, while Agent 09 owns the platform storage adapter.
- The OrderPaid event payload must be reconciled with Agent 04's final publisher before production activation.
- The certificate PDF is generated on demand from a persisted issued certificate record; no third-party certificate authority or BNSP recognition is claimed.
