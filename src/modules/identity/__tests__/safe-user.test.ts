import { describe, expect, it, vi } from "vitest";

/**
 * Unit test getSafeUserProfile dengan Prisma di-mock — memastikan TIDAK ADA
 * passwordHash di data yang dikembalikan dan mapping field benar.
 */

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getSafeUserProfile } from "../services/profile.service";
import { prisma } from "@/lib/db/prisma";

const mockedFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;

const DB_USER = {
  id: "user-uuid-1",
  name: "Budi Santoso",
  email: "budi@example.com",
  passwordHash: "$argon2id$hash-rahasia",
  emailVerified: new Date("2026-01-01T00:00:00Z"),
  phone: "+628123456789",
  avatarUrl: null,
  timezone: "Asia/Jakarta",
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  roles: [{ role: "CUSTOMER" as const }],
};

describe("getSafeUserProfile", () => {
  it("tidak pernah mengembalikan passwordHash", async () => {
    mockedFindUnique.mockResolvedValue(DB_USER);
    const user = await getSafeUserProfile("user-uuid-1");
    expect(user).not.toBeNull();
    const serialized = JSON.stringify(user);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("argon2id");
  });

  it("memetakan field profil dengan benar", async () => {
    mockedFindUnique.mockResolvedValue(DB_USER);
    const user = await getSafeUserProfile("user-uuid-1");
    expect(user?.id).toBe("user-uuid-1");
    expect(user?.name).toBe("Budi Santoso");
    expect(user?.email).toBe("budi@example.com");
    expect(user?.emailVerified).toBe(true);
    expect(user?.roles).toEqual(["CUSTOMER"]);
    expect(user?.timezone).toBe("Asia/Jakarta");
  });

  it("mengembalikan null untuk user tidak ditemukan", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const user = await getSafeUserProfile("tidak-ada");
    expect(user).toBeNull();
  });
});
