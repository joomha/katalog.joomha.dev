import { describe, expect, it } from "vitest";
import {
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSIONS,
  type RoleName,
  type PermissionKey,
} from "../permissions";
import { resolveAccess } from "../services/rbac.service";

/**
 * Unit test RBAC — fungsi murni resolveAccess (tanpa database).
 * Matriks sesuai SHARED_CONTEXT §23.2 dan acceptance criteria Agent 02.
 */

const CUSTOMER_ROLES: RoleName[] = ["CUSTOMER"];
const STUDENT_ROLES: RoleName[] = ["CUSTOMER", "STUDENT"];
const INSTRUCTOR_ROLES: RoleName[] = ["CUSTOMER", "INSTRUCTOR"];
const ADMIN_ROLES: RoleName[] = ["ADMIN"];
const SUPERADMIN_ROLES: RoleName[] = ["SUPERADMIN"];

describe("resolveAccess — role dasar", () => {
  it("CUSTOMER tidak punya permission admin", () => {
    const access = resolveAccess({
      roles: CUSTOMER_ROLES,
      rolePermissionOverrides: [],
      userGrants: [],
    });
    expect(access.permissions.size).toBe(0);
    expect(access.permissions.has(PERMISSIONS.ADMIN_ACCESS)).toBe(false);
    expect(access.permissions.has(PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  it("STUDENT tidak punya permission admin", () => {
    const access = resolveAccess({
      roles: STUDENT_ROLES,
      rolePermissionOverrides: [],
      userGrants: [],
    });
    expect(access.permissions.has(PERMISSIONS.ADMIN_ACCESS)).toBe(false);
    expect(access.permissions.has(PERMISSIONS.ORDERS_MANAGE)).toBe(false);
  });

  it("INSTRUCTOR hanya akses shell admin + view tugasnya", () => {
    const access = resolveAccess({
      roles: INSTRUCTOR_ROLES,
      rolePermissionOverrides: [],
      userGrants: [],
    });
    expect(access.permissions.has(PERMISSIONS.ADMIN_ACCESS)).toBe(true);
    expect(access.permissions.has(PERMISSIONS.LEARNING_VIEW)).toBe(true);
    expect(access.permissions.has(PERMISSIONS.TUTORING_VIEW)).toBe(true);
    // Instruktur TIDAK boleh manage katalog/user/platform.
    expect(access.permissions.has(PERMISSIONS.CATALOG_MANAGE)).toBe(false);
    expect(access.permissions.has(PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(access.permissions.has(PERMISSIONS.PLATFORM_MANAGE)).toBe(false);
    // Instruktur TIDAK bisa melihat data instruktur lain → tidak ada users.manage.
    expect(access.permissions.has(PERMISSIONS.USERS_VIEW)).toBe(false);
  });

  it("ADMIN punya permission operasional sesuai default", () => {
    const access = resolveAccess({
      roles: ADMIN_ROLES,
      rolePermissionOverrides: [],
      userGrants: [],
    });
    for (const permission of ROLE_DEFAULT_PERMISSIONS.ADMIN) {
      expect(access.permissions.has(permission)).toBe(true);
    }
    // ADMIN biasa bukan superadmin → tidak otomatis punya platform.manage.
    expect(access.permissions.has(PERMISSIONS.PLATFORM_MANAGE)).toBe(false);
  });

  it("SUPERADMIN implisit memiliki SEMUA permission", () => {
    const access = resolveAccess({
      roles: SUPERADMIN_ROLES,
      rolePermissionOverrides: [
        { role: "SUPERADMIN", permissionKey: PERMISSIONS.PLATFORM_MANAGE, granted: false },
      ],
      userGrants: [],
    });
    const totalPermissions = Object.values(PERMISSIONS).length;
    expect(access.permissions.size).toBe(totalPermissions);
    expect(access.permissions.has(PERMISSIONS.PLATFORM_MANAGE)).toBe(true);
    expect(access.permissions.has(PERMISSIONS.USERS_MANAGE)).toBe(true);
  });
});

describe("resolveAccess — override dan grant", () => {
  it("Override granted=false mencabut default role", () => {
    const access = resolveAccess({
      roles: ADMIN_ROLES,
      rolePermissionOverrides: [
        { role: "ADMIN", permissionKey: PERMISSIONS.CATALOG_MANAGE, granted: false },
      ],
      userGrants: [],
    });
    expect(access.permissions.has(PERMISSIONS.CATALOG_MANAGE)).toBe(false);
    expect(access.permissions.has(PERMISSIONS.ORDERS_MANAGE)).toBe(true);
  });

  it("Override untuk role yang tidak dimiliki user diabaikan", () => {
    const access = resolveAccess({
      roles: INSTRUCTOR_ROLES,
      rolePermissionOverrides: [
        { role: "ADMIN", permissionKey: PERMISSIONS.USERS_MANAGE, granted: true },
      ],
      userGrants: [],
    });
    expect(access.permissions.has(PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  it("User grant individual menambah permission tanpa role baru", () => {
    const access = resolveAccess({
      roles: CUSTOMER_ROLES,
      rolePermissionOverrides: [],
      userGrants: [{ permissionKey: PERMISSIONS.CATALOG_VIEW }],
    });
    expect(access.permissions.has(PERMISSIONS.CATALOG_VIEW)).toBe(true);
    expect(access.permissions.has(PERMISSIONS.CATALOG_MANAGE)).toBe(false);
  });

  it("User grant tidak bisa melampaui pencabutan default? grant tetap menambah (kontrak: grant selalu menambah)", () => {
    const access = resolveAccess({
      roles: ADMIN_ROLES,
      rolePermissionOverrides: [
        { role: "ADMIN", permissionKey: PERMISSIONS.CATALOG_MANAGE, granted: false },
      ],
      userGrants: [{ permissionKey: PERMISSIONS.CATALOG_MANAGE }],
    });
    // Kontrak: grant individual diutamakan (untuk exception berbasis alasan audit).
    expect(access.permissions.has(PERMISSIONS.CATALOG_MANAGE)).toBe(true);
  });
});

describe("Katalog permission & role", () => {
  it("Semua role default terdefinisi untuk lima role", () => {
    for (const role of ["CUSTOMER", "STUDENT", "INSTRUCTOR", "ADMIN", "SUPERADMIN"] as RoleName[]) {
      expect(Array.isArray(ROLE_DEFAULT_PERMISSIONS[role])).toBe(true);
    }
  });

  it("Tidak ada permission ganda dalam default satu role", () => {
    for (const list of Object.values(ROLE_DEFAULT_PERMISSIONS)) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it("Setiap permission key unik di katalog", () => {
    const keys = Object.values(PERMISSIONS);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key).toMatch(/^[a-z]+\.[a-z]+$/);
    }
  });

  it("Tidak ada permission UNKNOWN di katalog default", () => {
    const allKeys = new Set(Object.values(PERMISSIONS) as PermissionKey[]);
    for (const list of Object.values(ROLE_DEFAULT_PERMISSIONS)) {
      for (const permission of list) {
        expect(allKeys.has(permission)).toBe(true);
      }
    }
  });
});
