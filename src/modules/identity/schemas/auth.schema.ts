import { z } from "zod";

/**
 * Schema validasi form dan input identitas.
 * Semua server action/route handler identitas memvalidasi input dengan schema
 * di file ini — input dari browser tidak pernah dipercaya langsung.
 */

/** Nama tampilan: 2–100 karakter. */
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 karakter.")
  .max(100, "Nama maksimal 100 karakter.");

/** Email dinormalisasi ke lowercase. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Format email tidak valid.")
  .max(255, "Email maksimal 255 karakter.");

/**
 * Kebijakan kata sandi minimal namun wajar:
 * - minimal 8 karakter, maksimal 128 (mencegah DoS hashing)
 * - wajib mengandung huruf dan angka.
 */
export const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi maksimal 128 karakter.")
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
    message: "Kata sandi harus mengandung huruf dan angka.",
  });

/** Nomor telepon opsional: 8–20 digit, boleh dengan + dan spasi. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?[0-9][0-9 ]{6,19})?$/, "Nomor telepon tidak valid.")
  .refine((v) => v === "" || v.length >= 8, "Nomor telepon minimal 8 digit.")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

/** Zona waktu IANA opsional. */
export const timezoneSchema = z
  .string()
  .trim()
  .regex(/^([A-Za-z_]+\/[A-Za-z_+\-0-9]+)?$/, "Zona waktu tidak valid.")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const registerSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Kata sandi wajib diisi.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "Token reset tidak valid.").max(256),
  password: passwordSchema,
});

export const updateProfileSchema = z
  .object({
    name: displayNameSchema,
    phone: phoneSchema,
    timezone: timezoneSchema,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi.").max(128),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
    path: ["newPassword"],
  });

export const userAddressSchema = z.object({
  label: z.string().trim().min(1, "Label alamat wajib diisi.").max(50, "Label maksimal 50 karakter."),
  recipientName: z.string().trim().max(100, "Nama penerima maksimal 100 karakter.").optional(),
  phone: phoneSchema,
  province: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  postalCode: z
    .string()
    .trim()
    .max(10, "Kode pos maksimal 10 karakter.")
    .optional(),
  fullAddress: z.string().trim().min(10, "Alamat lengkap minimal 10 karakter.").max(500, "Alamat maksimal 500 karakter."),
  notes: z.string().trim().max(300, "Catatan maksimal 300 karakter.").optional(),
  isDefault: z.boolean().default(false),
  /** Consent pemakaian alamat untuk layanan offline. */
  consentToServiceUse: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserAddressInput = z.infer<typeof userAddressSchema>;
