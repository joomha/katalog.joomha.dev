# Seed Process

> Agent 10 · Integration & QA Documentation  
> **Dev-only. Never run seed in production.**

## Overview

The seed orchestrator (`prisma/seed.ts`) runs all domain seeds in dependency order. Each seed uses `upsert` operations, making it **idempotent** — safe to run multiple times without duplicating data.

## Dependency Order

```
1. Catalog & Storefront (Agent 03)
   └── 2. Commerce & Payments (Agent 04)
   └── 3. Learning Management System (Agent 05)
   └── 4. Business Services (Agent 07)

Skipped:
   - Private Tutoring (Agent 06) — schema stub, not implemented
   - AI Consultation (Agent 08) — stateless, no seed needed
   - Platform / Notifications (Agent 09) — settings managed via admin UI
```

## Running the Seed

```bash
# Full seed run (all domains in order)
pnpm db:seed

# Alternatively, run directly with tsx
pnpm dlx tsx prisma/seed.ts
```

## Expected Output

```
════════════════════════════════════════════════════════════
  katalog.joomha.dev — Integration Seed Orchestrator
  Agent 10 · 2026-11-06T...
════════════════════════════════════════════════════════════

════════════════════════════════════════════════════════════
🌱  Seeding: Catalog & Storefront (Agent 03)
────────────────────────────────────────────────────────────
🌱 Starting Catalog & Storefront Seeding (45 Initial Listings)...
✅  Catalog & Storefront (Agent 03) seeded in 1234ms

════════════════════════════════════════════════════════════
🌱  Seeding: Commerce & Payments (Agent 04)
────────────────────────────────────────────────────────────
...
════════════════════════════════════════════════════════════

  SEED SUMMARY
────────────────────────────────────────────────────────────
  ✅  Catalog & Storefront (Agent 03) (1234ms)
  ✅  Commerce & Payments (Agent 04) (456ms)
  ✅  Learning Management System (Agent 05) (789ms)
  ✅  Business Services (Agent 07) (123ms)
  ⏭️   Private Tutoring (Agent 06)  → Schema stub only
  ⏭️   AI Consultation (Agent 08)   → Stateless per-request
  ⏭️   Platform & Notifications (Agent 09)  → Managed via admin UI
────────────────────────────────────────────────────────────
  Total seed time: 2602ms
════════════════════════════════════════════════════════════
```

## Resetting and Re-seeding

```bash
# Reset DB and re-apply migrations + seed
npx prisma migrate reset --schema=prisma
# (Prisma migrate reset automatically runs `pnpm db:seed` after migrations)
```

## Seed Files

| File | Domain | Records Created |
|------|--------|----------------|
| `prisma/seeds/catalog.seed.ts` | Catalog (Agent 03) | Categories + 45 catalog items |
| `prisma/seeds/commerce.seed.ts` | Commerce (Agent 04) | Payment providers, discount rules |
| `prisma/seeds/learning.seed.ts` | Learning (Agent 05) | Courses, lessons, assessments, games |
| `prisma/seeds/business-services.seed.ts` | Business Services (Agent 07) | Service detail records per catalog item |

## Adding a New Seed

1. Create `prisma/seeds/<domain>.seed.ts` exporting `async function seed<Domain>(): Promise<void>`
2. Use `upsert` with a stable unique key (slug, code, etc.) — **never use `create`** for seed data
3. Import and call the function in `prisma/seed.ts` in the correct dependency order
4. Document the records it creates in this file

## Idempotency Requirements

All seed functions MUST be idempotent:

```typescript
// ✅ Correct — idempotent
await prisma.catalogCategory.upsert({
  where: { slug: "web-development" },
  update: { name: "Web Development" },
  create: { slug: "web-development", name: "Web Development" },
});

// ❌ Wrong — will fail on second run
await prisma.catalogCategory.create({
  data: { slug: "web-development", name: "Web Development" },
});
```

## Security Notes

- **Never** include real passwords, API keys, or payment credentials in seed data
- Use obviously fake credentials for test users: `test-password-not-real`, `fake@example.com`
- Seed data is committed to git — treat it as public
