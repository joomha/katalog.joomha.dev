import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * Unit test hashing Argon2id: roundtrip + kegagalan aman.
 * Hashing nyata butuh native binding @node-rs/argon2 — ini juga memastikan
 * binding berjalan di lingkungan pengujian.
 */

describe("password hashing (Argon2id)", () => {
  it("hash → verify roundtrip sukses", async () => {
    const hash = await hashPassword("rahasia-aman-123");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(30);
    await expect(verifyPassword(hash, "rahasia-aman-123")).resolves.toBe(true);
  });

  it("password salah gagal diverifikasi", async () => {
    const hash = await hashPassword("rahasia-aman-123");
    await expect(verifyPassword(hash, "password-lain-456")).resolves.toBe(false);
  });

  it("dua hash untuk password sama menghasilkan salt berbeda", async () => {
    const hash1 = await hashPassword("password-sama-789");
    const hash2 = await hashPassword("password-sama-789");
    expect(hash1).not.toEqual(hash2);
    await expect(verifyPassword(hash1, "password-sama-789")).resolves.toBe(true);
    await expect(verifyPassword(hash2, "password-sama-789")).resolves.toBe(true);
  });

  it("hash tidak valid gagal tertutup tanpa throw", async () => {
    await expect(verifyPassword("bukan-hash-yang-valid", "apa-pun")).resolves.toBe(false);
  });

  it("hash tidak menyimpan plaintext", async () => {
    const hash = await hashPassword("plaintext-jangan-ada-111");
    expect(hash).not.toContain("plaintext-jangan-ada-111");
  });
});
