import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";

/**
 * Password hashing Argon2id (rekomendasi OWASP untuk credential login).
 * - memoryCost 19 MiB, timeCost 2, parallelism 1 = konfigurasi minimum OWASP.
 * - @node-rs/argon2 memakai Argon2id sebagai algoritma default; opsi `algorithm`
 *   sengaja tidak ditulis karena enum-nya ambient (tidak kompatibel
 *   isolatedModules) — lihat docs/API_CONTRACTS.md.
 * - Hash disimpan di `users.password_hash`; plaintext TIDAK PERNAH disimpan
 *   atau dilog.
 */

const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2Hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2Verify(passwordHash, plainPassword);
  } catch {
    // Hash tidak valid (rusak/diubah) → gagal tertutup, tanpa membocorkan detail.
    return false;
  }
}
