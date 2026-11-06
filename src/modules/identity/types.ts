import type { RoleName } from "./permissions";

/**
 * Tipe publik modul identity. Tidak ada password hash di tipe manapun yang
 * diekspor dari modul ini.
 */

/** Data user yang aman ditampilkan/dipakai lintas modul. */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  isActive: boolean;
  roles: RoleName[];
  createdAt: Date;
}

/** User pada session JWT (cepat, untuk UI/middleware). */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

/** Profil instruktur aman lintas modul. */
export interface InstructorPublicProfile {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  specializations: string[];
  isActive: boolean;
}

/** Alamat user untuk layanan offline (akses terbatas + consent). */
export interface SafeUserAddress {
  id: string;
  label: string;
  recipientName: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  fullAddress: string;
  notes: string | null;
  isDefault: boolean;
  serviceUseConsentAt: Date | null;
}

/** Hasil operasi server action: sukses dengan data atau gagal dengan pesan. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Error otentikasi/otorisasi untuk server action & route handler. */
export class UnauthenticatedError extends Error {
  constructor(message = "Sesi berakhir. Silakan masuk kembali.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class AccessDeniedError extends Error {
  constructor(message = "Anda tidak memiliki izin untuk tindakan ini.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}
