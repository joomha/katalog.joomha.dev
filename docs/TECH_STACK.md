# Joomha Education — Technical Stack Baseline

> **Tanggal Audit & Pemeriksaan Baseline:** 6 November 2026  
> **Status:** Stabil, dikunci (locked), dan disepakati sebagai fondasi untuk Agent 01–10.

---

## 1. Ringkasan Versi Stack

| Komponen / Lapisan | Versi Terkunci | Keterangan & Kompatibilitas |
|---|---|---|
| **Runtime** | `Node.js 24 LTS` (`^24.0.0` / baseline Node 22+ local support) | Didokumentasikan di `.nvmrc` dan `.node-version`. Mendukung Web Streams, crypto global, dan ESM modern. |
| **Package Manager** | `pnpm 12.16.1` (engine `>=9.0.0`) | Dependensi dikunci secara deterministik di `pnpm-lock.yaml`. |
| **Framework** | `Next.js 15.2.1` | App Router, React Server Components (RSC), Turbopack ready. |
| **Library UI** | `React 19.0.0` & `React DOM 19.0.0` | React Server Actions, standard hooks, form status. |
| **Bahasa Pemrograman** | `TypeScript 5.7.3` | Strict mode diaktifkan di `tsconfig.json`, target ES2022. |
| **Styling & Theme** | `Tailwind CSS 3.4.17` + `tailwindcss-animate 1.0.7` | PostCSS 8, Autoprefixer 10, CSS Variables color tokens. |
| **UI Primitive** | `shadcn/ui` base (`components.json`) + `lucide-react 0.475.0` | CVA (`class-variance-authority 0.7.1`), `tailwind-merge 3.0.2`, `clsx 2.1.1`. |
| **Database ORM** | `Prisma 6.4.1` (`@prisma/client 6.4.1`) | PostgreSQL target, multi-file schema baseline via `prisma/models/`. |
| **Database Server** | `PostgreSQL 16+` (dengan extension `pgvector`) | Target produksi cloud database, managed connection. |
| **Validasi Skema & Env** | `Zod 3.24.2` | Runtime parsing untuk environment, form, server actions, dan DTO. |
| **Testing (Unit & Integration)** | `Vitest 3.0.7` + `@vitejs/plugin-react 4.3.4` + `jsdom 26.0.0` | Unit test cepat berbasis Vite, compatible dengan path alias `@/*`. |
| **Testing (E2E)** | `@playwright/test 1.50.1` | E2E browser automation (disiapkan baseline untuk Agent 10). |
| **Linter & Code Quality** | `ESLint 9.21.0` + `eslint-config-next 15.2.1` | Flat config (`eslint.config.mjs`). |

---

## 2. Struktur Lingkungan (.env) & Keamanan

Variabel lingkungan dikelompokkan dengan ketat:
- **Server-Only Env:** `DATABASE_URL`, `AUTH_SECRET`, `OPENROUTER_API_KEY`, `STORAGE_SECRET_KEY`, dll. Tidak boleh diawali prefix `NEXT_PUBLIC_` dan divalidasi dengan `src/lib/env/server.ts`.
- **Public Env:** Hanya variabel dengan prefix `NEXT_PUBLIC_` yang diizinkan untuk dikonsumsi browser, divalidasi dengan `src/lib/env/client.ts`.
- **Secret Zero-Tolerance:** Tidak ada API key nyata yang dimasukkan ke repository, git commit, atau `.env.example`.

---

## 3. Database & Prisma Multi-File Conventions

- Konfigurasi schema utama berada di `prisma/schema.prisma`.
- Model domain disimpan terpisah per file di `prisma/models/*.prisma` (misal `identity.prisma`, `catalog.prisma`, `commerce.prisma`, `learning.prisma`, dll).
- Agent 01 hanya menyiapkan baseline koneksi singleton di `src/lib/db/prisma.ts`.
- **Aturan Migrasi:** Seluruh migrasi database (`prisma/migrations/**`) dikelola secara terpusat oleh **Agent 10**. Agent domain dilarang membuat migrasi manual.

---

## 4. Perintah Operasional

```bash
# Development server
pnpm dev

# Typecheck & Lint
pnpm typecheck
pnpm lint

# Unit tests
pnpm test
pnpm test:watch

# Database client generation
pnpm db:generate

# Production build
pnpm build
```

