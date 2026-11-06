import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "./config";
import { loginSchema } from "@/modules/identity/schemas/auth.schema";
import { verifyCredentials } from "@/modules/identity/services/login.service";

/**
 * Instance Auth.js lengkap (Node runtime) — adapter Prisma + credentials.
 * Strategy session: JWT (dipakai credentials login); cookie session aman
 * (HttpOnly, SameSite=lax, Secure otomatis di production via AUTH_URL/HTTPS).
 * Middleware memakai versi edge-safe dari `./config` (pola split-config v5).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email dan Kata Sandi",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      async authorize(credentials, request) {
        // Validasi input dari browser — tidak pernah dipercaya langsung.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const result = await verifyCredentials({
          email: parsed.data.email,
          password: parsed.data.password,
          headers: new Headers(request?.headers),
        });

        if (!result.ok) {
          // Semua kegagalan mengembalikan null → Auth.js menolak sign-in
          // tanpa membocorkan penyebab spesifik ke klien.
          return null;
        }

        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          roles: result.user.roles,
          isActive: result.user.isActive,
        };
      },
    }),
  ],
});
