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
| Rate limiting | In-memory sliding window + tabel `auth_attempts` | Lapis cepat per-instance + tabel lintas instance; interface `RateLimiter` siap diganti Redis |

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
  getCurrentUser, requireUser, requireRole, requirePermission, requireAdminAccess,
  assertAuthenticated, assertRole, assertPermission, assertOwnInstructorData, PERMISSIONS,
} from "@/modules/identity";
```

**Pola halaman admin domain (Agent 03–09):**

```tsx
import { requirePermission, PERMISSIONS } from "@/modules/identity";
export default async function Page() {
  const admin = await requirePermission(PERMISSIONS.CATALOG_MANAGE);
}
```

### Permission catalog

Role → default permission ada di `src/modules/identity/permissions.ts`:
`CUSTOMER`/`STUDENT`: tanpa permission admin. `INSTRUCTOR`: `admin.access`,
`learning.view`, `tutoring.view`, `consultation.view`. `ADMIN`: permission operasional
katalog/order/learning/tutoring/business/consultation + `users.view`. `SUPERADMIN`:
implisit semua. Tambahan individual via tabel `user_permissions`, pencabutan default
via `role_permissions`.

---

## Catalog Module (Agent 03)

*(Kontrak katalog dipublikasikan oleh Agent 03.)*

## Commerce Module (Agent 04)

*(Kontrak commerce dipublikasikan oleh Agent 04.)*

## Learning Module (Agent 05)

*(Kontrak learning dipublikasikan oleh Agent 05.)*

## Tutoring Module (Agent 06)

*(Kontrak tutoring dipublikasikan oleh Agent 06.)*

## Business Services Module (Agent 07)

*(Kontrak business services dipublikasikan oleh Agent 07.)*

## AI Consultant Module (Agent 08)

*(Kontrak AI Consultant dipublikasikan oleh Agent 08.)*

## Platform Module (Agent 09) — `src/modules/platform/index.ts`

### Notification
- `createNotification(input)` dan `createNotifications(inputs)`: operasi manual memerlukan `platform.manage`.
- `listNotificationsForUser(options)`, `markNotificationRead(id)`, `markAllNotificationsRead()`, `updateNotificationPreference(category, values)`: selalu dibatasi ke user dari session server.
- `handlePlatformDomainEvent(event)`: subscriber server-side untuk event tepercaya; payload menerima `userId` atau `recipientUserIds: string[]`. Dedupe key per event dan penerima.
- Event yang dipetakan: `OrderPaid`, `OrderCancelled`, `CourseCompleted`, `CertificateIssued`, `TutoringQuoteAwaitingReview`, `QuoteApprovedByInstructor`, `TutoringSessionScheduled`, `ConsultationHandedOff`, `BusinessProposalApproved`, `ProjectMilestoneUpdated`. `EnrollmentCreated` didukung sebagai alias untuk event enrollment.

### Storage
- `uploadStoredFile(input)`: wajib login; file owner selain user aktif memerlukan `platform.manage`.
- `getAuthorizedFileAccess(fileId, authorizeEntitlement?)`: public file boleh diakses tanpa login; private file harus dimiliki user, admin, atau lolos callback entitlement yang disediakan modul domain.
- `deleteStoredFile(fileId)` / `archiveStoredFile(fileId)`: pemilik file atau pemegang `platform.manage`.
- Local adapter menyimpan file di luar `public/`; jika env lama menunjuk `public/uploads`, adapter fallback aman ke `var/private-files`. S3 belum diaktifkan karena provider/SDK belum diputuskan.

### Audit dan settings
- `writeAuditLog(input)`: actor harus user aktif yang sedang login; aksi atas nama actor lain atau tanpa actor memerlukan `platform.manage`. Metadata sensitif disaring.
- `listAuditLogs(options)`: memerlukan `platform.view`.
- `getPublicSystemSettings()`: hanya key publik allowlist.
- `getAdminSystemSettings()`: memerlukan `platform.view`.
- `updateSystemSetting(key, value)`: typed allowlist dan memerlukan `platform.manage`; perubahan ditulis ke audit log.
- Secret/API key tidak dapat disimpan lewat SystemSetting; simpan di env/secret manager.

### API routes dan UI
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`.
- `GET /api/files/:id` menjalankan pemeriksaan akses sebelum mengirim file.
- `PATCH /api/admin/platform/settings` memvalidasi key/value dan permission.
- Notification center tersedia pada `/akun/notifikasi` dan `/admin/platform/notifikasi`; platform overview pada `/admin/platform`.

### Email
- Email adapter saat ini adalah mock console logger untuk development; log hanya mencatat tujuan, subject, dan panjang pesan.
- Email notifikasi umum memakai subject/body generik agar tidak memuat detail transaksi atau PII. Provider SMTP belum dipilih/dikonfigurasi; `MAIL_DRIVER=smtp` tetap belum aktif.

---

## Keputusan integrasi yang perlu diperhatikan

- Agent 10 membuat migration dan generate Prisma Client setelah menggabungkan seluruh schema domain.
- Event bus MVP bersifat in-process; event subscriber platform diregistrasikan ketika public module platform di-import di server.
- Agent 05/08 wajib memanggil `getAuthorizedFileAccess` dengan entitlement callback yang memeriksa enrollment/akses knowledge document; jangan expose storage key.
