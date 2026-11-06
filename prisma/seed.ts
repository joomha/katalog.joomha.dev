/**
 * prisma/seed.ts
 * Agent 10 — Integration Seed Orchestrator
 *
 * Runs all domain seeds in dependency order. Each seed is idempotent
 * (upsert-based), so this script is safe to re-run without duplicating data.
 *
 * Dependency Order:
 *   1. Catalog (categories + catalog items) — no dependencies
 *   2. Commerce (payment providers, discount rules) — requires catalog items
 *   3. Learning (courses, lessons, assessments) — requires catalog items
 *   4. Business Services (service details) — requires catalog items (BUSINESS_SERVICE type)
 *
 * Skipped:
 *   - Tutoring (Agent 06) — schema is a stub; seed not implemented
 *   - AI Consultation (Agent 08) — stateless per-request service; no seed data needed
 *   - Platform / Notifications (Agent 09) — system settings seeded via UI; no dev seed needed
 *
 * Usage (dev):
 *   pnpm db:seed
 *   # or directly:
 *   pnpm dlx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { seedCatalog } from "./seeds/catalog.seed";
import { seedCommerce } from "./seeds/commerce.seed";
import { seedLearning } from "./seeds/learning.seed";
import { seedBusinessServices } from "./seeds/business-services.seed";

const prisma = new PrismaClient();

interface SeedResult {
  domain: string;
  status: "success" | "skipped" | "failed";
  message?: string;
  durationMs?: number;
}

async function runSeed(
  domain: string,
  fn: () => Promise<void>
): Promise<SeedResult> {
  const start = Date.now();
  try {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🌱  Seeding: ${domain}`);
    console.log(`${"─".repeat(60)}`);
    await fn();
    const durationMs = Date.now() - start;
    console.log(`✅  ${domain} seeded in ${durationMs}ms`);
    return { domain, status: "success", durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌  ${domain} FAILED after ${durationMs}ms: ${message}`);
    return { domain, status: "failed", message, durationMs };
  }
}

async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  katalog.joomha.dev — Integration Seed Orchestrator`);
  console.log(`  Agent 10 · $(new Date().toISOString())`);
  console.log(`${"═".repeat(60)}\n`);

  const results: SeedResult[] = [];

  // 1. Catalog — must run first (all other domains reference CatalogItem)
  results.push(await runSeed("Catalog & Storefront (Agent 03)", seedCatalog));

  // Abort if catalog failed — downstream seeds will all fail without catalog items
  if (results[0].status === "failed") {
    console.error(
      "\n🚨  Catalog seed failed. Aborting remaining seeds to prevent FK violations."
    );
    printSummary(results);
    process.exit(1);
  }

  // 2. Commerce — requires catalog items to exist
  results.push(await runSeed("Commerce & Payments (Agent 04)", seedCommerce));

  // 3. Learning — requires catalog items (COURSE type)
  results.push(
    await runSeed("Learning Management System (Agent 05)", seedLearning)
  );

  // 4. Business Services — requires catalog items (BUSINESS_SERVICE type)
  results.push(
    await runSeed("Business Services (Agent 07)", seedBusinessServices)
  );

  // 5. Skipped domains
  const skipped: SeedResult[] = [
    {
      domain: "Private Tutoring (Agent 06)",
      status: "skipped",
      message: "Schema stub only — Agent 06 not implemented",
    },
    {
      domain: "AI Consultation (Agent 08)",
      status: "skipped",
      message: "Stateless per-request; no seed data needed",
    },
    {
      domain: "Platform & Notifications (Agent 09)",
      status: "skipped",
      message: "System settings managed via admin UI",
    },
  ];

  printSummary([...results, ...skipped]);

  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    process.exit(1);
  }
}

function printSummary(results: SeedResult[]) {
  const totalMs = results
    .filter((r) => r.durationMs !== undefined)
    .reduce((acc, r) => acc + (r.durationMs ?? 0), 0);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  SEED SUMMARY`);
  console.log(`${"─".repeat(60)}`);

  for (const r of results) {
    const icon =
      r.status === "success"
        ? "✅"
        : r.status === "skipped"
          ? "⏭️ "
          : "❌";
    const duration = r.durationMs !== undefined ? ` (${r.durationMs}ms)` : "";
    const note = r.message ? `  → ${r.message}` : "";
    console.log(`  ${icon}  ${r.domain}${duration}${note}`);
  }

  console.log(`${"─".repeat(60)}`);
  console.log(`  Total seed time: ${totalMs}ms`);
  console.log(`${"═".repeat(60)}\n`);
}

main()
  .catch((err) => {
    console.error("Unhandled error in seed orchestrator:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
