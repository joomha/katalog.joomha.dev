import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginRateLimiter } from "@/lib/auth/rate-limit";
import { getIdentityConfig } from "../config";
import type { RoleName } from "../permissions";

/**
 * Verifikasi credentials login + pencatatan percobaan (brute-force protection
 * dua lapis: in-memory + database `auth_attempts`).
 *
 * Prinsip anti-enumeration: untuk email/kata sandi salah selalu dikembalikan
 * pesan generik yang sama; tidak pernah dibedakan "email tidak ada" vs
 * "password salah".
 */

export type CredentialsFailureReason =
  | "invalid_credentials"
  | "rate_limited"
  | "account_inactive"
  | "email_unverified";

export interface CredentialsVerificationSuccess {
  ok: true;
  user: {
    id: string;
    name: string;
    email: string;
    roles: RoleName[];
    isActive: boolean;
  };
}

export interface CredentialsVerificationFailure {
  ok: false;
  reason: CredentialsFailureReason;
  message: string;
  /** Detik tunggu sebelum percobaan berikutnya (hanya bila rate_limited). */
  retryAfterSeconds?: number;
}

export type CredentialsVerificationResult =
  | CredentialsVerificationSuccess
  | CredentialsVerificationFailure;

/** Pesan generik — dipakai untuk semua kegagalan email/password agar tidak membocorkan keberadaan akun. */
const GENERIC_INVALID_MESSAGE = "Email atau kata sandi salah.";

function getIp(requestHeaders: Headers): string | null {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return requestHeaders.get("x-real-ip") ?? null;
}

export async function verifyCredentials(params: {
  email: string;
  password: string;
  headers: Headers;
}): Promise<CredentialsVerificationResult> {
  const config = getIdentityConfig();
  const email = params.email.trim().toLowerCase();
  const ip = getIp(params.headers);
  const userAgent = params.headers.get("user-agent")?.slice(0, 255) ?? null;
  const rateKey = `${email}:${ip ?? "unknown"}`;

  // Lapis 1: in-memory (cepat, per-instance).
  const memoryCheck = loginRateLimiter.check(rateKey);
  if (!memoryCheck.allowed) {
    return {
      ok: false,
      reason: "rate_limited",
      message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${memoryCheck.retryAfterSeconds} detik.`,
      retryAfterSeconds: memoryCheck.retryAfterSeconds,
    };
  }

  // Lapis 2: database — tahan lintas instance dan restart.
  const windowStart = new Date(Date.now() - config.AUTH_LOGIN_FAIL_WINDOW_MINUTES * 60 * 1000);
  const recentFailures = await prisma.authAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: windowStart },
    },
  });
  if (recentFailures >= config.AUTH_LOGIN_FAIL_MAX_ATTEMPTS) {
    loginRateLimiter.reset(rateKey);
    const minutesLeft = Math.max(1, Math.ceil(config.AUTH_LOGIN_FAIL_WINDOW_MINUTES / 2));
    return {
      ok: false,
      reason: "rate_limited",
      message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${minutesLeft} menit.`,
      retryAfterSeconds: minutesLeft * 60,
    };
  }

  const recordFailure = () =>
    prisma.authAttempt.create({ data: { email, ip, success: false, userAgent } });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (!user || !user.passwordHash) {
    await recordFailure();
    return { ok: false, reason: "invalid_credentials", message: GENERIC_INVALID_MESSAGE };
  }

  const passwordValid = await verifyPassword(user.passwordHash, params.password);
  if (!passwordValid) {
    await recordFailure();
    return { ok: false, reason: "invalid_credentials", message: GENERIC_INVALID_MESSAGE };
  }

  if (!user.isActive) {
    return {
      ok: false,
      reason: "account_inactive",
      message: "Akun Anda dinonaktifkan. Silakan hubungi tim Joomha.",
    };
  }

  if (config.AUTH_REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
    return {
      ok: false,
      reason: "email_unverified",
      message: "Email Anda belum diverifikasi. Periksa kotak masuk untuk tautan verifikasi.",
    };
  }

  loginRateLimiter.reset(rateKey);
  await Promise.all([
    prisma.authAttempt.create({
      data: { email, ip, success: true, userAgent, userId: user.id },
    }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map((r) => r.role),
      isActive: user.isActive,
    },
  };
}
