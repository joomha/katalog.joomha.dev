import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { generateSecureToken } from "@/lib/security";
import { hashPassword } from "@/lib/auth/password";
import { getIdentityConfig } from "../config";
import { getIdentityMailer } from "./mailer";

/**
 * Alur lupa/reset kata sandi.
 * - Token mentah hanya dikirim ke email; database menyimpan SHA-256 hash-nya.
 * - Token sekali pakai (usedAt) dan berkedaluwarsa (expiresAt).
 * - Respons request reset selalu generik → tidak membocorkan keberadaan akun.
 */

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Minta tautan reset. Selalu sukses dari sudut pandang pemanggil (anti-enumeration). */
export async function requestPasswordReset(params: {
  email: string;
  appUrl?: string;
}): Promise<{ sent: true }> {
  const config = getIdentityConfig();
  const email = params.email.trim().toLowerCase();
  const appUrl = params.appUrl?.replace(/\/$/, "") ?? "";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, isActive: true },
  });

  // Tidak pernah error "email tidak ditemukan" ke pemanggil.
  if (user && user.isActive) {
    const rawToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + config.AUTH_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(rawToken),
        expiresAt,
      },
    });

    const mailer = getIdentityMailer();
    try {
      await mailer.sendPasswordResetEmail({
        to: email,
        recipientName: user.name,
        resetUrl: `${appUrl}/reset-sandi?token=${rawToken}`,
      });
    } catch (error) {
      // Driver belum tersedia: token tetap tercatat; kegagalan dikonsumsi
      // secara jujur di log, pengguna tetap melihat pesan generik.
      console.error("[password-reset] Gagal mengirim email reset:", error instanceof Error ? error.message : error);
    }
  }

  return { sent: true };
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/** Reset kata sandi memakai token sekali pakai. */
export async function resetPassword(params: {
  token: string;
  newPassword: string;
}): Promise<ResetPasswordResult> {
  const tokenHash = sha256(params.token.trim());

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, isActive: true } } },
  });

  const invalidMessage = "Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.";

  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
    return { ok: false, error: invalidMessage };
  }

  const passwordHash = await hashPassword(params.newPassword);

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Semua token reset user lainnya dibatalkan setelah reset sukses.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch {
    return { ok: false, error: "Gagal menyimpan kata sandi baru. Silakan coba lagi." };
  }

  return { ok: true };
}
