import { describe, expect, it } from "vitest";
import {
  registerSchema,
  loginSchema,
  passwordSchema,
  emailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  userAddressSchema,
} from "../schemas/auth.schema";

/**
 * Unit test schema Zod — validasi input register/login/reset/profil.
 */

describe("emailSchema", () => {
  it("menormalkan email ke lowercase dan trim", () => {
    const parsed = emailSchema.parse("  Budi@Joomha.DEV ");
    expect(parsed).toBe("budi@joomha.dev");
  });
  it("menolak email invalid", () => {
    expect(emailSchema.safeParse("bukan-email").success).toBe(false);
    expect(emailSchema.safeParse("a@b").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("menerima password kuat", () => {
    expect(passwordSchema.safeParse("rahasia123").success).toBe(true);
  });
  it("menolak pendek, tanpa angka, atau tanpa huruf", () => {
    expect(passwordSchema.safeParse("abc123").success).toBe(false); // < 8
    expect(passwordSchema.safeParse("hanyahurufaja").success).toBe(false); // tanpa angka
    expect(passwordSchema.safeParse("12345678").success).toBe(false); // tanpa huruf
  });
  it("menolak terlalu panjang (DoS hashing)", () => {
    expect(passwordSchema.safeParse("a".repeat(129) + "1").success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("valid untuk data lengkap", () => {
    const parsed = registerSchema.safeParse({
      name: "Budi Santoso",
      email: "Budi@Example.com",
      password: "rahasia123",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("budi@example.com");
  });
  it("nama terlalu pendek ditolak", () => {
    expect(
      registerSchema.safeParse({ name: "B", email: "budi@example.com", password: "rahasia123" })
        .success
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("password kosong ditolak", () => {
    expect(loginSchema.safeParse({ email: "budi@example.com", password: "" }).success).toBe(false);
  });
  it("email dibutuhkan", () => {
    expect(loginSchema.safeParse({ email: "budi@example.com", password: "rahasia123" }).success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("token pendek ditolak", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "shorttoken", password: "rahasia123" }).success
    ).toBe(false);
  });
  it("data valid diterima", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "x".repeat(64),
        password: "rahasia123",
      }).success
    ).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("password baru sama dengan lama ditolak", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "rahasia123",
        newPassword: "rahasia123",
      }).success
    ).toBe(false);
  });
  it("password baru valid diterima", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "rahasia123",
        newPassword: "rahasiaBaru123",
      }).success
    ).toBe(true);
  });
});

describe("userAddressSchema", () => {
  it("alamat valid + consent diterima", () => {
    const parsed = userAddressSchema.safeParse({
      label: "Rumah",
      fullAddress: "Jl. Merdeka No. 10, Jakarta Pusat",
      isDefault: true,
      consentToServiceUse: true,
    });
    expect(parsed.success).toBe(true);
  });
  it("alamat terlalu pendek ditolak", () => {
    expect(
      userAddressSchema.safeParse({
        label: "Rumah",
        fullAddress: "pendek",
        isDefault: false,
        consentToServiceUse: false,
      }).success
    ).toBe(false);
  });
  it("consent opsional false diterima", () => {
    expect(
      userAddressSchema.safeParse({
        label: "Kantor",
        fullAddress: "Jl. Sudirman Kav. 52, Jakarta Selatan",
        consentToServiceUse: false,
      }).success
    ).toBe(true);
  });
});
