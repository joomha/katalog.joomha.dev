/**
 * Katalog permission dan default per role.
 *
 * Kontrak (SHARED_CONTEXT BAGIAN A §4):
 * - Role: CUSTOMER, STUDENT, INSTRUCTOR, ADMIN, SUPERADMIN.
 * - Permission granular server-side; menyembunyikan tombol bukan kontrol keamanan.
 * - SUPERADMIN memiliki seluruh hak secara implisit (`hasPermission` → true).
 *
 * Resolution order `rbac.service.ts`:
 * 1. SUPERADMIN → semua permission.
 * 2. Default role (ROLE_DEFAULT_PERMISSIONS di file ini).
 * 3. Override `role_permissions` (granted=false mencabut default).
 * 4. Grant individual `user_permissions` (hanya menambah, tidak pernah mencabut).
 */

export const PERMISSIONS = {
  /** Dasbor admin shell. */
  ADMIN_ACCESS: "admin.access",
  /** Kelola listing katalog (Agent 03). */
  CATALOG_MANAGE: "catalog.manage",
  /** Lihat data katalog internal (Agent 03). */
  CATALOG_VIEW: "catalog.view",
  /** Kelola order dan pembayaran (Agent 04). */
  ORDERS_MANAGE: "orders.manage",
  /** Lihat order dan pembayaran (Agent 04). */
  ORDERS_VIEW: "orders.view",
  /** Kelola kursus, materi, enrollment (Agent 05). */
  LEARNING_MANAGE: "learning.manage",
  /** Lihat kelas/enrollment yang ditugaskan (Agent 05). */
  LEARNING_VIEW: "learning.view",
  /** Kelola penawaran les dan jadwal (Agent 06). */
  TUTORING_MANAGE: "tutoring.manage",
  /** Lihat sesi/penawaran les yang ditugaskan (Agent 06). */
  TUTORING_VIEW: "tutoring.view",
  /** Kelola proposal dan proyek jasa (Agent 07). */
  BUSINESS_MANAGE: "business.manage",
  /** Lihat proyek jasa yang ditugaskan (Agent 07). */
  BUSINESS_VIEW: "business.view",
  /** Kelola konsultasi AI dan handoff (Agent 08). */
  CONSULTATION_MANAGE: "consultation.manage",
  /** Lihat konsultasi yang ditugaskan (Agent 08). */
  CONSULTATION_VIEW: "consultation.view",
  /** Kelola akun dan role pengguna (Agent 02/09). */
  USERS_MANAGE: "users.manage",
  /** Lihat data pengguna (Agent 02/09). */
  USERS_VIEW: "users.view",
  /** Konfigurasi platform, notifikasi, audit (Agent 09). */
  PLATFORM_MANAGE: "platform.manage",
  /** Lihat konfigurasi platform (Agent 09). */
  PLATFORM_VIEW: "platform.view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);

/** Nama role konsisten dengan enum Prisma `RoleType`. */
export const ROLES = ["CUSTOMER", "STUDENT", "INSTRUCTOR", "ADMIN", "SUPERADMIN"] as const;
export type RoleName = (typeof ROLES)[number];

/**
 * Default permission per role. SUPERADMIN implisit memiliki semuanya.
 * ADMIN memakai subset sesuai tanggung jawab operasional.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  CUSTOMER: [],
  STUDENT: [],
  INSTRUCTOR: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.LEARNING_VIEW,
    PERMISSIONS.TUTORING_VIEW,
    PERMISSIONS.CONSULTATION_VIEW,
  ],
  ADMIN: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.CATALOG_MANAGE,
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.LEARNING_MANAGE,
    PERMISSIONS.LEARNING_VIEW,
    PERMISSIONS.TUTORING_MANAGE,
    PERMISSIONS.TUTORING_VIEW,
    PERMISSIONS.BUSINESS_MANAGE,
    PERMISSIONS.BUSINESS_VIEW,
    PERMISSIONS.CONSULTATION_MANAGE,
    PERMISSIONS.CONSULTATION_VIEW,
    PERMISSIONS.USERS_VIEW,
  ],
  SUPERADMIN: [], // implisit: semua permission
};
