#!/usr/bin/env node
/**
 * CLI aman untuk membuat/memperbarui SUPERADMIN awal.
 * Milik modul identitas (Agent 02). Tidak ada password default di source code.
 *
 * Pemakaian (jalankan dari root repo, setelah `pnpm install` + `pnpm db:generate`):
 *
 *   SUPERADMIN_EMAIL="admin@joomha.dev" \
 *   SUPERADMIN_PASSWORD="kata-sandi-yang-kuat-123" \
 *   SUPERADMIN_NAME="Nama Admin" \
 *   pnpm identity:create-superadmin
 *
 * - Email & password WAJIB diberikan lewat environment/terminal, tidak pernah
 *   di-commit. Password minimal 8 karakter, mengandung huruf dan angka.
 * - Bila user dengan email tersebut sudah ada, perintah ini memutakhirkan
 *   nama/password bila diberikan dan MEMASTIKAN role SUPERADMIN terpasang —
 *   tidak pernah menurunkan role yang sudah ada.
 * - Jalankan hanya di lingkungan terpercaya (server/CI internal).
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Ambil DATABASE_URL & AUTH env dari .env / .env.local sederhana (tanpa dependensi dotenv).
function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* file opsional */
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const EMAIL = process.env.SUPERADMIN_EMAIL ?? "";
const PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "";
const NAME = process.env.SUPERADMIN_NAME ?? "Superadmin Joomha";

function fail(message) {
  console.error(`[create-superadmin] ${message}`);
  process.exit(1);
}

if (!EMAIL || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(EMAIL)) {
  fail("SUPERADMIN_EMAIL wajib diisi dengan email valid melalui environment variable.");
}
if (!PASSWORD || PASSWORD.length < 8 || !/[A-Za-z]/.test(PASSWORD) || !/[0-9]/.test(PASSWORD)) {
  fail(
    "SUPERADMIN_PASSWORD wajib diisi melalui environment variable (minimal 8 karakter, mengandung huruf dan angka)."
  );
}
if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL belum dikonfigurasi (salin .env.example → .env.local dan sesuaikan).");
}

async function main() {
  // Dependensi di-resolve setelah env termuat.
  const { PrismaClient } = require("@prisma/client");
  const { hash } = require("@node-rs/argon2");

  const prisma = new PrismaClient();
  try {
    const passwordHash = await hash(PASSWORD, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const email = EMAIL.trim().toLowerCase();

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        name: NAME,
        email,
        passwordHash,
        isActive: true,
        roles: { create: [{ role: "SUPERADMIN" }] },
      },
      update: {
        name: NAME,
        passwordHash,
        isActive: true,
      },
      include: { roles: true },
    });

    // Pastikan role SUPERADMIN terpasang untuk kedua jalur (create maupun update).
    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role: "SUPERADMIN" } },
      create: { userId: user.id, role: "SUPERADMIN" },
      update: {},
    });

    console.log(
      `[create-superadmin] Berhasil. Superadmin: ${user.name} <${user.email}> (id: ${user.id})`
    );
    console.log("[create-superadmin] JANGAN simpan password ini di repo; ganti setelah login pertama bila perlu.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
