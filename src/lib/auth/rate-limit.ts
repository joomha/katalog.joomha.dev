/**
 * Contract rate limiting untuk endpoint autentikasi.
 *
 * Dua lapis proteksi brute-force:
 * 1. In-memory sliding window (file ini) — cepat, per-instance, untuk
 *    endpoint register/reset/login. Extension point resmi: implementasi
 *    Redis (mis. `ioredis`) dapat menggantikan limiter ini dengan mengikuti
 *    interface `RateLimiter` — dilakukan Agent 09/10 bila multi-instance.
 * 2. Database `auth_attempts` (modul identity) — tahan lintas instance,
 *    dipakai service login; lihat `src/modules/identity/services/login.service.ts`.
 *
 * Pemakaian yang disarankan: login (per email+IP), register (per IP),
 * lupa sandi (per email+IP).
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Detik sampai jendela dibuka kembali (0 jika allowed). */
  retryAfterSeconds: number;
  /** Sisa percobaan dalam jendela saat ini. */
  remaining: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
  reset(key: string): void;
}

interface AttemptWindow {
  timestamps: number[];
}

interface InMemoryRateLimiterOptions {
  /** Ukuran jendela dalam milidetik. */
  windowMs: number;
  /** Maksimum percobaan per jendela. */
  maxAttempts: number;
}

export function createInMemoryRateLimiter(options: InMemoryRateLimiterOptions): RateLimiter {
  const { windowMs, maxAttempts } = options;
  const buckets = new Map<string, AttemptWindow>();

  function prune(window: AttemptWindow, now: number): number[] {
    return window.timestamps.filter((ts) => now - ts < windowMs);
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const window = buckets.get(key) ?? { timestamps: [] };
      const valid = prune(window, now);

      if (valid.length >= maxAttempts) {
        const oldest = valid[0];
        const retryAfterMs = windowMs - (now - oldest);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
          remaining: 0,
        };
      }

      valid.push(now);
      buckets.set(key, { timestamps: valid });
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: maxAttempts - valid.length,
      };
    },
    reset(key: string): void {
      buckets.delete(key);
    },
  };
}

/** Limiter login: 10 percobaan / 15 menit per kunci (email+IP). */
export const loginRateLimiter = createInMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
});

/** Limiter register: 5 pendaftaran / jam per IP. */
export const registerRateLimiter = createInMemoryRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 5,
});

/** Limiter permintaan reset password: 5 permintaan / jam per email+IP. */
export const passwordResetRateLimiter = createInMemoryRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 5,
});
