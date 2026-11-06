import { z } from "zod";

/**
 * Konfigurasi modul identitas.
 * Mandiri (tidak mengubah src/lib/env milik Agent 01); divalidasi dengan Zod
 * saat runtime dan didokumentasikan di docs/API_CONTRACTS.md.
 */

const identityConfigSchema = z.object({
  /**
   * Wajib verifikasi email sebelum login.
   * Default false: email provider belum tersedia di fase awal.
   * Bila true, pengguna belum verifikasi ditolak login dengan pesan jelas.
   */
  AUTH_REQUIRE_EMAIL_VERIFICATION: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  /** Masa berlaku token reset password (menit). */
  AUTH_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(10).max(1440).default(60),
  /** Batas kegagalan login per email+IP dalam jendela DB (menit). */
  AUTH_LOGIN_FAIL_WINDOW_MINUTES: z.coerce.number().int().min(5).max(1440).default(15),
  /** Maksimum kegagalan login per email+IP dalam jendela. */
  AUTH_LOGIN_FAIL_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(100).default(10),
  /** Driver email identitas (Agent 09 akan menyediakan SMTP). */
  MAIL_DRIVER: z.enum(["console", "smtp"]).default("console"),
});

export type IdentityConfig = z.infer<typeof identityConfigSchema>;

let cached: IdentityConfig | null = null;

export function getIdentityConfig(): IdentityConfig {
  if (!cached) {
    const result = identityConfigSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error("Konfigurasi identitas tidak valid: " + result.error.message);
    }
    cached = result.data;
  }
  return cached;
}

/** Khusus pengujian. */
export function resetIdentityConfigCache(): void {
  cached = null;
}
