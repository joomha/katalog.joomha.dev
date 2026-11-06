import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi dasar Auth.js yang aman untuk Edge Runtime (middleware).
 *
 * PENTING: File ini TIDAK boleh mengimpor modul Node-only (Prisma, argon2).
 * Provider credentials dan adapter database digabungkan di `src/lib/auth/index.ts`
 * (pola split-config resmi Auth.js v5).
 */

export const AUTH_PAGES = {
  /** Halaman login. */
  signIn: "/masuk",
  /** Halaman error bawaan tidak dipakai; error login dirender di /masuk. */
  error: "/masuk",
} as const;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 hari

/** Bentuk user tambahan yang dibawa authorize() ke callback jwt(). */
interface AuthJitUser {
  roles?: unknown;
  isActive?: unknown;
}

function toRoleList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: AUTH_PAGES,
  providers: [], // diisi di src/lib/auth/index.ts (Node runtime)
  callbacks: {
    /**
     * Token JWT membawa daftar role yang diambil saat login oleh authorize().
     * Role di token hanya untuk pemeriksaan cepat di middleware/UI; keputusan
     * keamanan selalu diverifikasi ulang dari database oleh guard module.
     */
    jwt({ token, user }) {
      const jitUser = (user ?? {}) as AuthJitUser;
      if (user) {
        token.roles = toRoleList(jitUser.roles);
        token.isActive = typeof jitUser.isActive === "boolean" ? jitUser.isActive : true;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.roles = toRoleList(token.roles);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
