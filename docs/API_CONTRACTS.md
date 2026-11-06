# API Contracts — Joomha Education

> Dokumen kontrak lintas modul. Setiap agent menambahkan section domainnya di sini
> saat mempublikasikan public API. Jangan mengubah section domain lain tanpa koordinasi.

---

## Identity Module (Agent 02) — `src/modules/identity/index.ts`

Modul lain **hanya boleh mengimpor** dari `@/modules/identity` (index.ts), bukan dari
file internal modul.

### Pilihan teknis autentikasi

| Keputusan | Nilai | Alasan |
|---|---|---|
| Library | Auth.js v5 (`next-auth@5.0.0-beta.32`) | Baseline SHARED_CONTEXT; App Router native |
| Session strategy | **JWT** (HttpOnly cookie `authjs.session-token`) | Credentials provider v5 tidak mendukung database session; cookie aman + rotasi built-in |
| Adapter | `@auth/prisma-adapter@2.11.3` | Model `Account`/`Session`/`VerificationToken` siap dipakai bila OAuth diaktifkan |
| Password hashing | `@node-rs/argon2@2.2.2` (Argon2id, m=19 MiB, t=2, p=1) | Rekomendasi Auth.js/OWASP untuk credentials |
| Rate limiting | In-memory sliding window + tabel `auth_attempts` | Lapis cepat per-instance + lapis lintas instance; interface `RateLimiter` siap diganti Redis |

**Konfigurasi production session:** set `AUTH_SECRET` (32+ byte acak, `openssl rand -base64 33`),
`AUTH_URL=https://edu.joomha.dev`, dan layani lewat HTTPS — Auth.js otomatis menandai cookie
`Secure` di production, `SameSite=Lax` default, `HttpOnly` selalu. Tanpa HTTPS, session ditolak.

### Env variables modul identitas

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `AUTH_SECRET` | Ya (prod) | fallback dev dari Agent 01 | Secret penandatanganan session JWT |
| `AUTH_URL` | Ya (prod) | `http://localhost:3000` | Base URL untuk reset link & redirect |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Tidak | `false` | Aktifkan setelah email provider tersedia (Agent 09) |
| `AUTH_RESET_TOKEN_TTL_MINUTES` | Tidak | `60` | Masa berlaku token reset |
| `AUTH_LOGIN_FAIL_MAX_ATTEMPTS` | Tidak | `10` | Batas kegagalan login per email+IP |
| `AUTH_LOGIN_FAIL_WINDOW_MINUTES` | Tidak | `15` | Jendela penghitungan kegagalan |

### Membuat superadmin awal (aman, tanpa password di source code)

```bash
cp .env.example .env.local        # sesuaikan DATABASE_URL dulu
pnpm install && pnpm db:generate
SUPERADMIN_EMAIL="admin@joomha.dev" \
SUPERADMIN_PASSWORD="ganti-dengan-sandi-kuat-123" \
SUPERADMIN_NAME="Nama Superadmin" \
pnpm identity:create-superadmin
```

### Public API guards (server-side, wajib dipakai semua modul)

```ts
import {
  getCurrentUser,        // SafeUser | null (fresh dari DB, isActive diperiksa)
  requireUser,           // redirect("/masuk") bila belum login
  requireRole,           // requireRole(["INSTRUCTOR"]) → AccessDeniedError bila salah role
  requirePermission,     // requirePermission(PERMISSIONS.CATALOG_MANAGE)
  requireAdminAccess,    // guard shell /admin (ADMIN/SUPERADMIN/INSTRUCTOR)
  assertAuthenticated,   // varian throw untuk server action/route handler
  assertRole,
  assertPermission,
  assertOwnInstructorData, // guard data-scope instruktur (Agent 05/06)
  PERMISSIONS,
} from "@/modules/identity";
```

**Pola halaman admin domain (Agent 03–09):**

```tsx
// src/app/(admin)/admin/katalog/page.tsx (contoh milik Agent 03)
import { requirePermission, PERMISSIONS } from "@/modules/identity";
export default async function Page() {
  const admin = await requirePermission(PERMISSIONS.CATALOG_MANAGE);
  // ...
}
```

Guard layout `/admin` sudah menutup akses di level shell; halaman domain tetap WAJIB
memanggil `requirePermission(...)` sesuai kebutuhan halamannya (defense in depth).

**Pola server action:**

```ts
import { assertPermission, PERMISSIONS, AccessDeniedError, UnauthenticatedError } from "@/modules/identity";
export async function updateCatalogItem() {
  const admin = await assertPermission(PERMISSIONS.CATALOG_MANAGE);
  // ...
}
```

### Permission catalog

Role → default permission ada di `src/modules/identity/permissions.ts`:
`CUSTOMER`/`STUDENT`: tanpa permission admin. `INSTRUCTOR`: `admin.access`,
`learning.view`, `tutoring.view`, `consultation.view`. `ADMIN`: permission operasional
katalog/order/learning/tutoring/business/consultation + `users.view`. `SUPERADMIN`:
implisit semua. Tambahan individual via tabel `user_permissions`, pencabutan default
via `role_permissions`.

### Kontrak database lintas domain

Domain lain **TIDAK menambahkan** `@relation` ke model identity. Untuk mengacu ke
user/instruktur, gunakan kolom `userId String @db.Uuid` (+ `@@index`) pada file schema
domain sendiri dan resolve join di application layer. Ini menjaga file
`prisma/models/identity.prisma` tetap milik Agent 02.

### Event identitas (untuk Agent 09)

Modul identitas tidak menerbitkan event domain. Notifikasi (reset password, akun baru)
akan dihubungkan oleh Agent 09 melalui `IdentityMailer` di
`src/modules/identity/services/mailer.ts` — implementasikan interface itu pada
driver SMTP (saat ini `MAIL_DRIVER=console` mencetak tautan ke log server).

---

## Catalog Module (Agent 03)

*(Belum dipublikasikan — Agent 03 akan mengisi section ini.)*

## Commerce Module (Agent 04)

*(Belum dipublikasikan.)*

## Learning Module (Agent 05)

*(Belum dipublikasikan.)*

## Tutoring Module (Agent 06)

*(Belum dipublikasikan.)*

## Business Services Module (Agent 07)

*(Belum dipublikasikan.)*

## AI Consultant Module (Agent 08)

*(Belum dipublikasikan.)*

## Platform Module (Agent 09)

*(Belum dipublikasikan.)*
