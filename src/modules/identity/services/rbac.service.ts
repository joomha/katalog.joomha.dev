import { prisma } from "@/lib/db/prisma";
import {
  ALL_PERMISSIONS,
  ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  type PermissionKey,
  type RoleName,
} from "../permissions";

/**
 * Resolusi permission RBAC.
 *
 * Urutan resolusi (lihat permissions.ts):
 * 1. SUPERADMIN → semua permission.
 * 2. Default role (ROLE_DEFAULT_PERMISSIONS).
 * 3. Override tabel `role_permissions` (granted=false mencabut default role).
 * 4. Grant individual `user_permissions` (hanya menambah).
 *
 * Semua pemeriksaan otorisasi server-side WAJIB melalui service ini
 * (atau guard yang memakainya) — bukan hanya menyembunyikan tombol di UI.
 */

export interface ResolvedAccess {
  roles: RoleName[];
  permissions: Set<PermissionKey>;
}

/**
 * Fungsi murni resolusi permission — dipisah dari akses database agar mudah
 * diuji unit tanpa Prisma.
 */
export function resolveAccess(input: {
  roles: RoleName[];
  rolePermissionOverrides: { role: RoleName; permissionKey: PermissionKey; granted: boolean }[];
  userGrants: { permissionKey: PermissionKey }[];
}): ResolvedAccess {
  const permissions = new Set<PermissionKey>();

  if (input.roles.includes("SUPERADMIN")) {
    return { roles: input.roles, permissions: new Set(ALL_PERMISSIONS) };
  }

  // 1) Default per role.
  const roleDefaults = new Set<PermissionKey>();
  for (const role of input.roles) {
    for (const p of ROLE_DEFAULT_PERMISSIONS[role] ?? []) roleDefaults.add(p);
  }
  for (const p of roleDefaults) permissions.add(p);

  // 2) Override per role dari DB.
  for (const override of input.rolePermissionOverrides) {
    if (!input.roles.includes(override.role)) continue; // override role yang tidak dimiliki user diabaikan
    if (override.granted) {
      permissions.add(override.permissionKey);
    } else {
      permissions.delete(override.permissionKey);
    }
  }

  // 3) Grant individual user (hanya menambah).
  for (const grant of input.userGrants) {
    permissions.add(grant.permissionKey);
  }

  return { roles: input.roles, permissions };
}

/** Ambil daftar role user. */
export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });
  return roles.map((r) => r.role);
}

/**
 * Resolusi akses lengkap seorang user (untuk requirePermission).
 * NOTE: tidak memvalidasi isActive — pemanggil wajib memastikan user aktif
 * (guard melakukannya).
 */
export async function resolveUserAccess(userId: string): Promise<ResolvedAccess> {
  const [userRoles, overrides, grants] = await Promise.all([
    prisma.userRole.findMany({ where: { userId }, select: { role: true } }),
    prisma.rolePermission.findMany({ select: { role: true, permissionKey: true, granted: true } }),
    prisma.userPermission.findMany({ where: { userId }, select: { permissionKey: true } }),
  ]);

  return resolveAccess({
    roles: userRoles.map((r) => r.role),
    rolePermissionOverrides: overrides.map((o) => ({
      role: o.role,
      permissionKey: o.permissionKey as PermissionKey,
      granted: o.granted,
    })),
    userGrants: grants.map((g) => ({ permissionKey: g.permissionKey as PermissionKey })),
  });
}

/** Cek satu permission untuk user. */
export async function hasPermission(userId: string, permission: PermissionKey): Promise<boolean> {
  const access = await resolveUserAccess(userId);
  return access.permissions.has(permission);
}

/** Validasi nama role string dari sumber eksternal (form/API). */
export function isValidRoleName(role: string): role is RoleName {
  return (ROLES as readonly string[]).includes(role);
}

/**
 * Menetapkan/mencabut role. PEMANGGIL wajib memverifikasi bahwa actor
 * memiliki permission `users.manage` (atau superadmin) — ditegakkan di
 * server action / CLI, bukan di sini.
 */
export async function assignRole(params: {
  userId: string;
  role: RoleName;
  assignedBy?: string | null;
}): Promise<void> {
  await prisma.userRole.upsert({
    where: { userId_role: { userId: params.userId, role: params.role } },
    create: { userId: params.userId, role: params.role, assignedBy: params.assignedBy ?? null },
    update: { assignedBy: params.assignedBy ?? null },
  });
}

export async function removeRole(userId: string, role: RoleName): Promise<void> {
  await prisma.userRole.deleteMany({ where: { userId, role } });
}
