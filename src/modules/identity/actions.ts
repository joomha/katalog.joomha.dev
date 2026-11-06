"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";
import { passwordResetRateLimiter, registerRateLimiter, loginRateLimiter } from "@/lib/auth/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  userAddressSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./schemas/auth.schema";
import { registerCustomer } from "./services/register.service";
import { requestPasswordReset, resetPassword } from "./services/password-reset.service";
import {
  changeOwnPassword,
  createOwnAddress,
  deleteOwnAddress,
  updateOwnAddress,
  updateOwnProfile,
} from "./services/profile.service";
import { assertAuthenticated } from "./guards";

/**
 * Server actions modul identitas. Semua input divalidasi Zod, semua akses
 * ditegakkan server-side (assertAuthenticated + scoping ke user sendiri),
 * dan endpoint sensitif dibatasi rate limiter.
 */

export interface FormState {
  ok?: boolean;
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const GENERIC_LOGIN_ERROR = "Email atau kata sandi salah.";

async function getIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip") ?? null;
}

function zodToFormState(error: import("zod").ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: error.issues[0]?.message ?? "Data tidak valid.", fieldErrors };
}

// ---------------------------------------------------------------------------
// Register / Login / Logout
// ---------------------------------------------------------------------------

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getIp();
  const limit = registerRateLimiter.check(`register:${ip ?? "unknown"}`);
  if (!limit.allowed) {
    return {
      error: `Terlalu banyak pendaftaran dari jaringan ini. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const result = await registerCustomer(parsed.data);
  if (!result.ok) {
    return { error: result.error };
  }

  // Auto sign-in setelah registrasi berhasil.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Registrasi sukses tapi sign-in gagal → arahkan ke login manual.
      redirect("/masuk?status=terdaftar");
    }
    throw error;
  }
  redirect("/akun");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const ip = await getIp();
  const email = parsed.data.email;
  const rateKey = `${email}:${ip ?? "unknown"}`;

  // Pre-check rate limit agar pesan retry bisa presisi; penegakan sesungguhnya
  // tetap dilakukan ulang di authorize().
  const memoryCheck = loginRateLimiter.check(rateKey);
  if (!memoryCheck.allowed) {
    return {
      error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${memoryCheck.retryAfterSeconds} detik.`,
    };
  }

  const nextUrl = formData.get("next");
  const safeNext =
    typeof nextUrl === "string" && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
      ? nextUrl
      : "/akun";

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: GENERIC_LOGIN_ERROR };
    }
    throw error;
  }
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

// ---------------------------------------------------------------------------
// Lupa & reset kata sandi
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const ip = await getIp();
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return zodToFormState(parsed.error);

  const limit = passwordResetRateLimiter.check(`reset:${parsed.data.email}:${ip ?? "unknown"}`);
  if (!limit.allowed) {
    // Pesan tetap generik agar pola rate limit tidak jadi oracle enumerasi.
    return { ok: true, success: "Jika email terdaftar, tautan reset telah dikirim." };
  }

  const appUrl = getServerEnv().AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  await requestPasswordReset({ email: parsed.data.email, appUrl });

  return { ok: true, success: "Jika email terdaftar, tautan reset telah dikirim." };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const result = await resetPassword({
    token: parsed.data.token,
    newPassword: parsed.data.password,
  });
  if (!result.ok) {
    return { error: result.error };
  }
  redirect("/masuk?status=reset-berhasil");
}

// ---------------------------------------------------------------------------
// Profil, kata sandi, alamat (wajib login)
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let user;
  try {
    user = await assertAuthenticated();
  } catch {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const result = await updateOwnProfile(user.id, parsed.data);
  if (!result.ok) return { error: result.error };
  return { ok: true, success: "Profil berhasil diperbarui." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let user;
  try {
    user = await assertAuthenticated();
  } catch {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const result = await changeOwnPassword(user.id, parsed.data);
  if (!result.ok) return { error: result.error };
  return { ok: true, success: "Kata sandi berhasil diganti." };
}

export async function createAddressAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let user;
  try {
    user = await assertAuthenticated();
  } catch {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const parsed = userAddressSchema.safeParse({
    label: formData.get("label"),
    recipientName: formData.get("recipientName") ?? undefined,
    phone: formData.get("phone"),
    province: formData.get("province") ?? undefined,
    city: formData.get("city") ?? undefined,
    district: formData.get("district") ?? undefined,
    postalCode: formData.get("postalCode") ?? undefined,
    fullAddress: formData.get("fullAddress"),
    notes: formData.get("notes") ?? undefined,
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
    consentToServiceUse: formData.get("consentToServiceUse") === "on",
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const result = await createOwnAddress(user.id, parsed.data);
  if (!result.ok) return { error: result.error };
  return { ok: true, success: "Alamat berhasil disimpan." };
}

export async function updateAddressAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let user;
  try {
    user = await assertAuthenticated();
  } catch {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return { error: "Alamat tidak valid." };

  const parsed = userAddressSchema.safeParse({
    label: formData.get("label"),
    recipientName: formData.get("recipientName") ?? undefined,
    phone: formData.get("phone"),
    province: formData.get("province") ?? undefined,
    city: formData.get("city") ?? undefined,
    district: formData.get("district") ?? undefined,
    postalCode: formData.get("postalCode") ?? undefined,
    fullAddress: formData.get("fullAddress"),
    notes: formData.get("notes") ?? undefined,
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
    consentToServiceUse: formData.get("consentToServiceUse") === "on",
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const result = await updateOwnAddress(user.id, addressId, parsed.data);
  if (!result.ok) return { error: result.error };
  return { ok: true, success: "Alamat berhasil diperbarui." };
}

export async function deleteAddressAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  let user;
  try {
    user = await assertAuthenticated();
  } catch {
    return { error: "Sesi berakhir. Silakan masuk kembali." };
  }

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return { error: "Alamat tidak valid." };

  const deleted = await deleteOwnAddress(user.id, addressId);
  if (!deleted) return { error: "Alamat tidak ditemukan." };
  return { ok: true, success: "Alamat berhasil dihapus." };
}
