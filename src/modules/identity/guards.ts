import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PERMISSIONS, type PermissionKey, type RoleName } from "./permissions";
import { resolveUserAccess, hasPermission as checkPermission } from "./services/rbac.service";
import type { SafeUser } from "./types";
import { AccessDeniedError, UnauthenticatedError } from "./types";

/**
 * Guard server-side untuk halaman (Server Component) dan server action.
 * Pola pemakaian:
 * - Halaman: `const user = await requireUser();`
 * - Halaman admin: `const user = await requireRole(["ADMIN", "SUPERADMIN"]);`
 * - Fitur admin granular: `await requirePermission(PERMISSIONS.CATALOG_MANAGE);`
 * - Server action/route handler: pakai `assert*` (melempar error, bukan redirect).
 *
 * Session JWT hanya sumber cepat; keputusan keamanan selalu diverifikasi ulang
 * ke database (user aktif + role/permission fresh).
 */

/** User session saat ini dari JWT (cepat; UI + pemeriksaan awal). */
export const getCurrentSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email,
    roles: (session.user.roles ?? []) as string[],
  };
});

/** Profil user aman, fresh dari DB (isActive diperiksa). */
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { roles: true },
  });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified != null,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    isActive: user.isActive,
    roles: user.roles.map((r) => r.role),
    createdAt: user.createdAt,
  };
});

/** Halaman terlindungi: wajib login, selain itu redirect ke /masuk. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/masuk");
  }
  return user;
}

/** Halaman terlindungi: wajib login + salah satu role. */
export async function requireRole(roles: readonly RoleName[]): Promise<SafeUser> {
  const user = await requireUser();
  const allowed = roles.some((role) => user.roles.includes(role));
  if (!allowed) {
    throw new AccessDeniedError();
  }
  return user;
}

/**
 * Halaman terlindungi: wajib permission granular.
 * SUPERADMIN selalu lolos; role lain dicek default role + override DB + grant user.
 */
export async function requirePermission(permission: PermissionKey): Promise<SafeUser> {
  const user = await requireUser();
  const allowed = await checkPermission(user.id, permission);
  if (!allowed) {
    throw new AccessDeniedError();
  }
  return user;
}

/** Akses shell admin: role admin-side ATAU permission admin.access. */
export async function requireAdminAccess(): Promise<SafeUser> {
  const user = await requireUser();
  const hasRole = user.roles.some((r) =>
    r === "ADMIN" || r === "SUPERADMIN" || r === "INSTRUCTOR"
  );
  const allowed = hasRole || (await checkPermission(user.id, PERMISSIONS.ADMIN_ACCESS));
  if (!allowed) {
    throw new AccessDeniedError();
  }
  return user;
}

// ---------------------------------------------------------------------------
// Varian untuk server action / route handler (lempar error, bukan redirect)
// ---------------------------------------------------------------------------

export async function assertAuthenticated(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export async function assertRole(roles: readonly RoleName[]): Promise<SafeUser> {
  const user = await assertAuthenticated();
  const allowed = roles.some((role) => user.roles.includes(role));
  if (!allowed) throw new AccessDeniedError();
  return user;
}

export async function assertPermission(permission: PermissionKey): Promise<SafeUser> {
  const user = await assertAuthenticated();
  const allowed = await checkPermission(user.id, permission);
  if (!allowed) throw new AccessDeniedError();
  return user;
}

/**
 * Guard data-scope instruktur (Agent 05/06 memakai ini):
 * pastikan user adalah instruktur DAN target userId milik dirinya.
 * INSTRUCTOR tidak dapat melihat/mengubah data instruktur lain tanpa
 * permission tambahan.
 */
export async function assertOwnInstructorData(targetUserId: string): Promise<SafeUser> {
  const user = await assertAuthenticated();
  if (user.roles.includes("ADMIN") || user.roles.includes("SUPERADMIN")) return user;
  if (!user.roles.includes("INSTRUCTOR") || user.id !== targetUserId) {
    throw new AccessDeniedError();
  }
  return user;
}

/** Cek cepat tanpa lempar (untuk render kondisional UI). */
export async function canAccessAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const hasRole = user.roles.some((r) =>
    r === "ADMIN" || r === "SUPERADMIN" || r === "INSTRUCTOR"
  );
  return hasRole || checkPermission(user.id, PERMISSIONS.ADMIN_ACCESS);
}

/** Akses efektif user saat ini (roles + permissions) untuk UI admin. */
export async function getCurrentUserAccess() {
  const user = await getCurrentUser();
  if (!user) return null;
  const access = await resolveUserAccess(user.id);
  return { user, permissions: Array.from(access.permissions) };
}
