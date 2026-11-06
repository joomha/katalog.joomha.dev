# Joomha Education

Platform terpadu **Digital Learning & Business Solutions** yang menggabungkan:
1. **E-Commerce & Digital Products:** Pembelian langsung modul/template digital.
2. **Online LMS:** Kursus mandiri berbasis App Router, materi bertahap, pretest/posttest, gamified quiz, dan penerbitan sertifikat digital.
3. **Les Privat Fleksibel:** Kelas privat daring, luring, atau hibrida dengan estimasi tarif dinamis dan jadwal terintegrasi.
4. **Jasa Digitalisasi & Konsultasi AI:** Transformasi bisnis, penawaran proposal bertahap berbasis milestone, dan konsultasi interaktif RAG bertenaga OpenRouter.

---

## Prasyarat Lingkungan

- **Node.js:** Versi 24 LTS (didukung Node 22+)
- **Package Manager:** `pnpm` (versi 9+)
- **Database:** PostgreSQL 16+ (mendukung extension `pgvector`)

---

## Panduan Instalasi & Menjalankan Aplikasi

1. **Clone repositori dan install dependensi:**
   ```bash
   pnpm install --frozen-lockfile
   ```

2. **Siapkan konfigurasi environment:**
   ```bash
   cp .env.example .env.local
   ```
   *Sesuaikan `DATABASE_URL` jika menggunakan instance PostgreSQL lokal.*

3. **Generate Prisma Client:**
   ```bash
   pnpm db:generate
   ```

4. **Jalankan development server:**
   ```bash
   pnpm dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Skrip NPM yang Tersedia

| Command | Deskripsi |
|---|---|
| `pnpm dev` | Menjalankan Next.js development server (hot reload) |
| `pnpm build` | Melakukan compile dan build produksi |
| `pnpm start` | Menjalankan build produksi secara lokal |
| `pnpm lint` | Memeriksa kepatuhan kode menggunakan ESLint |
| `pnpm typecheck` | Menjalankan typecheck TypeScript (`tsc --noEmit`) |
| `pnpm test` | Menjalankan unit & integration test menggunakan Vitest |
| `pnpm test:watch` | Menjalankan Vitest dalam watch mode |
| `pnpm db:generate` | Mengompilasi skema Prisma menjadi Prisma Client |
| `pnpm db:migrate:dev` | Menjalankan migrasi database di mode pengembangan |
| `pnpm db:migrate:deploy` | Menjalankan migrasi database untuk rilis produksi |
| `pnpm db:seed` | Menjalankan database seeder |

---

## Struktur Folder Repositori

```text
├── docs/                      # Dokumentasi arsitektur, tech stack, dan API contracts
├── prisma/                    # Schema Prisma dan model per domain (prisma/models/)
├── public/                    # Aset statis publik (images, icons, certificates)
├── src/
│   ├── app/                   # Next.js App Router (route groups per domain)
│   ├── components/            # Komponen UI dasar (shadcn/ui primitives)
│   ├── lib/                   # Utilities, env parser, database singleton, event bus, security
│   └── modules/               # Domain-driven feature modules (identity, catalog, commerce, lms, tutoring, dll)
├── tests/                     # Unit test & Playwright E2E test suites
└── .github/workflows/         # CI/CD GitHub Actions automation
```

---

## Lisensi & Hak Cipta
Hak Cipta &copy; 2026 Joomha Education. Seluruh hak cipta dilindungi.

