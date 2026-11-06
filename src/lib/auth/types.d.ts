import type { DefaultSession } from "next-auth";

/**
 * Augmentasi tipe Auth.js v5 untuk Joomha Education.
 * Role pada session JWT dipakai untuk pemeriksaan cepat (middleware/UI);
 * pemeriksaan otorisasi final selalu server-side dari database.
 */

declare module "next-auth" {
  /** Objek user yang dikembalikan authorize() credentials provider. */
  interface User {
    id: string;
    name: string;
    email: string;
    roles?: string[];
    isActive?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    isActive?: boolean;
  }
}
