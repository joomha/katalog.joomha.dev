import { prisma } from "@/lib/db/prisma";
import type { InstructorPublicProfile } from "../types";

/**
 * Layanan profil instruktur. Assignment kursus/sesi milik modul learning/
 * tutoring (mereka hanya menyimpan userId instruktur).
 */

export async function getInstructorProfileByUserId(
  userId: string
): Promise<InstructorPublicProfile | null> {
  const profile = await prisma.instructorProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    bio: profile.bio,
    specializations: profile.specializations,
    isActive: profile.isActive,
  };
}

export async function getInstructorProfile(id: string): Promise<InstructorPublicProfile | null> {
  const profile = await prisma.instructorProfile.findUnique({ where: { id } });
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    bio: profile.bio,
    specializations: profile.specializations,
    isActive: profile.isActive,
  };
}

/**
 * Membuat profil instruktur untuk user tertentu.
 * Pemanggil wajib memastikan actor berwenang (superadmin / users.manage).
 * User juga otomatis diberi role INSTRUCTOR bila belum memilikinya.
 */
export async function createInstructorProfileForUser(params: {
  userId: string;
  headline?: string | null;
  bio?: string | null;
  specializations?: string[];
}): Promise<InstructorPublicProfile> {
  const profile = await prisma.instructorProfile.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      headline: params.headline ?? null,
      bio: params.bio ?? null,
      specializations: params.specializations ?? [],
    },
    update: {
      headline: params.headline ?? undefined,
      bio: params.bio ?? undefined,
      specializations: params.specializations ?? undefined,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: params.userId, role: "INSTRUCTOR" } },
    create: { userId: params.userId, role: "INSTRUCTOR" },
    update: {},
  });

  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    bio: profile.bio,
    specializations: profile.specializations,
    isActive: profile.isActive,
  };
}
