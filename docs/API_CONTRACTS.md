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


---

## Platform Module (Agent 09) — `src/modules/platform/index.ts`

### Notification
- `createNotification(input)` dan `createNotifications(inputs)`: operasi manual memerlukan `platform.manage`.
- `listNotificationsForUser(options)`, `markNotificationRead(id)`, `markAllNotificationsRead()`, `getNotificationPreferences()`, `updateNotificationPreference(category, values)`: data dibatasi ke user dari session server.
- Kategori `TRANSACTIONAL` wajib aktif; kategori non-esensial dapat di-opt-out.
- Event handler tepercaya menerima `userId` atau `recipientUserIds: string[]`; dedupe key per event dan penerima.
- Event dipetakan: `OrderPaid`, `OrderCancelled`, `CourseCompleted`, `CertificateIssued`, `TutoringQuoteAwaitingReview`, `QuoteApprovedByInstructor`, `TutoringSessionScheduled`, `ConsultationHandedOff`, `BusinessProposalApproved`, `ProjectMilestoneUpdated`; `EnrollmentCreated` juga didukung.

### Storage
- `uploadStoredFile(input)`: wajib login; menyimpan metadata di `StoredFile`, random storage key, SHA-256, allowlist extension/MIME, pemeriksaan signature konten, dan menerapkan `maxUploadBytes` dari SystemSetting.
- `getAuthorizedFileAccess(fileId, authorizeEntitlement?)`: public file dapat diakses tanpa login; private file harus dimiliki user, admin, atau lolos callback entitlement.
- `deleteStoredFile(fileId)` / `archiveStoredFile(fileId)`: pemilik file atau pemegang `platform.manage`.
- Local adapter menyimpan di luar `public/`; env lama yang menunjuk ke `public/uploads` akan fallback ke `node_modules/.cache/joomha-private-files`. S3 belum diaktifkan karena provider/SDK belum diputuskan.

### Audit dan settings
- `writeAuditLog(input)`: actor harus user aktif yang sedang login; aksi atas nama actor lain atau tanpa actor memerlukan `platform.manage`. Metadata sensitif disaring.
- `listAuditLogs(options)` dan `getAdminSystemSettings()`: memerlukan `platform.view`.
- `getPublicSystemSettings()`: hanya key publik allowlist.
- `updateSystemSetting(key, value)`: typed allowlist dan memerlukan `platform.manage`; perubahan masuk audit log.
- Secret/API key tidak dapat disimpan melalui SystemSetting.

### API dan UI
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences`.
- `GET /api/files/:id` menjalankan pemeriksaan akses sebelum mengirim file.
- `PATCH /api/admin/platform/settings` memvalidasi key/value dan permission.
- Notification center: `/akun/notifikasi` dan `/admin/platform/notifikasi`; platform overview/settings/audit: `/admin/platform`; admin overview: `/admin`.

### Email dan integrasi
- Email adapter saat ini mock console logger untuk development; log hanya mencatat tujuan, subject, dan panjang pesan. Email notifikasi generik tidak membawa detail transaksi atau PII.
- Provider SMTP belum dipilih/dikonfigurasi; `MAIL_DRIVER=smtp` belum aktif.
- Event bus MVP bersifat in-process. Subscriber platform diregistrasikan ketika public module platform di-import di server. Publisher Agent 04–08 perlu memakai event name sesuai kontrak Shared Context.
- Agent 05/08 wajib memanggil `getAuthorizedFileAccess` dengan entitlement callback yang memeriksa enrollment/akses knowledge document; jangan expose storage key.
