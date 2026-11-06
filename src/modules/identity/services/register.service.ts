import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema, type RegisterInput } from "../schemas/auth.schema";
import { ROLES, type RoleName } from "../permissions";
import type { SafeUser } from "../types";

/**
 * Registrasi akun pelanggan baru. Selalu memberi role CUSTOMER; role lain
 * (STUDENT, INSTRUCTOR, ADMIN, SUPERADMIN) hanya dapat ditambahkan oleh
 * pihak yang berwenang melalui mekanisme assign role — bukan saat register.
 */

export type RegisterResult =
  | { ok: true; user: SafeUser }
  | { ok: false; error: string };

const DEFAULT_ROLES: RoleName[] = ["CUSTOMER"];

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

export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data pendaftaran tidak valid." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roles: {
        create: DEFAULT_ROLES.map((role) => ({ role })),
      },
    },
    include: { roles: true },
  });

  return { ok: true, user: toSafeUser(user) };
}

/** Konversi record user (hasil query dengan relasi roles) ke SafeUser. */
export function toSafeUserProfile(user: Parameters<typeof toSafeUser>[0]): SafeUser {
  return toSafeUser(user);
}

export const VALID_ROLE_NAMES: readonly RoleName[] = ROLES;
