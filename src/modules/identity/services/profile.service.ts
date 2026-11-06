import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  changePasswordSchema,
  updateProfileSchema,
  userAddressSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
  type UserAddressInput,
} from "../schemas/auth.schema";
import type { SafeUser, SafeUserAddress } from "../types";
import type { RoleName } from "../permissions";

/**
 * Layanan profil: data aman, update profil, ganti kata sandi, dan alamat
 * terstruktur (consent eksplisit untuk pemakaian layanan offline).
 * Semua operasi di file ini selalu scoped ke userId pemanggil — tidak ada
 * parameter "target user" sehingga tidak bisa dipakai melihat data user lain.
 */

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: Date;
  roles: { role: RoleName }[];
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified != null,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    isActive: user.isActive,
    roles: user.roles.map((r) => r.role),
    createdAt: user.createdAt,
  };
}

/** Ambil profil lengkap + data aman user (selalu fresh dari DB). */
export async function getSafeUserProfile(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });
  if (!user) return null;
  return toSafeUser(user);
}

/** Ambil data aman user berdasar email — untuk integrasi lintas modul (read-only). */
export async function getSafeUserByEmail(email: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { roles: true },
  });
  if (!user) return null;
  return toSafeUser(user);
}

export type UpdateProfileResult =
  | { ok: true; user: SafeUser }
  | { ok: false; error: string };

export async function updateOwnProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data profil tidak valid.",
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      timezone: parsed.data.timezone ?? null,
    },
    include: { roles: true },
  });

  return { ok: true, user: toSafeUser(updated) };
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changeOwnPassword(
  userId: string,
  input: ChangePasswordInput
): Promise<ChangePasswordResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return { ok: false, error: "Akun ini tidak mengaktifkan login dengan kata sandi." };
  }

  const currentValid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!currentValid) {
    return { ok: false, error: "Kata sandi saat ini salah." };
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } }),
    // Reset token lama dibatalkan setelah ganti sandi.
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Alamat terstruktur
// ---------------------------------------------------------------------------

function toSafeAddress(address: {
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
}): SafeUserAddress {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    postalCode: address.postalCode,
    fullAddress: address.fullAddress,
    notes: address.notes,
    isDefault: address.isDefault,
    serviceUseConsentAt: address.serviceUseConsentAt,
  };
}

export async function listOwnAddresses(userId: string): Promise<SafeUserAddress[]> {
  const addresses = await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return addresses.map(toSafeAddress);
}

export type CreateAddressResult =
  | { ok: true; address: SafeUserAddress }
  | { ok: false; error: string };

export async function createOwnAddress(
  userId: string,
  input: UserAddressInput
): Promise<CreateAddressResult> {
  const parsed = userAddressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data alamat tidak valid.",
    };
  }
  const data = parsed.data;

  const address = await prisma.$transaction(async (tx) => {
    const count = await tx.userAddress.count({ where: { userId } });
    if (count >= 10) {
      throw new Error("MAX_ADDRESSES");
    }
    // Alamat pertama otomatis menjadi default.
    const makeDefault = data.isDefault || count === 0;
    if (makeDefault) {
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.userAddress.create({
      data: {
        userId,
        label: data.label,
        recipientName: data.recipientName || null,
        phone: data.phone ?? null,
        province: data.province || null,
        city: data.city || null,
        district: data.district || null,
        postalCode: data.postalCode || null,
        fullAddress: data.fullAddress,
        notes: data.notes || null,
        isDefault: makeDefault,
        // Consent dicatat eksplisit; null berarti alamat tidak boleh dipakai
        // untuk layanan offline.
        serviceUseConsentAt: data.consentToServiceUse ? new Date() : null,
      },
    });
  });

  return { ok: true, address: toSafeAddress(address) };
}

export type UpdateAddressResult =
  | { ok: true; address: SafeUserAddress }
  | { ok: false; error: string };

export async function updateOwnAddress(
  userId: string,
  addressId: string,
  input: UserAddressInput
): Promise<UpdateAddressResult> {
  const parsed = userAddressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data alamat tidak valid.",
    };
  }
  const data = parsed.data;

  const existing = await prisma.userAddress.findUnique({
    where: { id: addressId },
    select: { id: true, userId: true },
  });
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Alamat tidak ditemukan." };
  }

  const address = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.userAddress.update({
      where: { id: addressId },
      data: {
        label: data.label,
        recipientName: data.recipientName || null,
        phone: data.phone ?? null,
        province: data.province || null,
        city: data.city || null,
        district: data.district || null,
        postalCode: data.postalCode || null,
        fullAddress: data.fullAddress,
        notes: data.notes || null,
        isDefault: data.isDefault,
        // Consent di-refresh setiap update; konsisten dengan form.
        serviceUseConsentAt: data.consentToServiceUse ? new Date() : null,
      },
    });
  });

  return { ok: true, address: toSafeAddress(address) };
}

export async function deleteOwnAddress(userId: string, addressId: string): Promise<boolean> {
  const result = await prisma.userAddress.deleteMany({
    where: { id: addressId, userId },
  });
  return result.count > 0;
}
