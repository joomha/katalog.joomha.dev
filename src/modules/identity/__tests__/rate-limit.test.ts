import { describe, expect, it, beforeEach } from "vitest";
import { createInMemoryRateLimiter, loginRateLimiter } from "@/lib/auth/rate-limit";

/**
 * Unit test rate limiter sliding window (contract brute-force protection).
 */

describe("createInMemoryRateLimiter", () => {
  it("mengizinkan sampai batas lalu memblokir", () => {
    const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxAttempts: 3 });
    expect(limiter.check("kunci").allowed).toBe(true);
    expect(limiter.check("kunci").allowed).toBe(true);
    expect(limiter.check("kunci").allowed).toBe(true);
    const blocked = limiter.check("kunci");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.remaining).toBe(0);
  });

  it("kunci berbeda tidak saling mempengaruhi", () => {
    const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("reset membuka kunci kembali", () => {
    const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
    limiter.check("kunci");
    expect(limiter.check("kunci").allowed).toBe(false);
    limiter.reset("kunci");
    expect(limiter.check("kunci").allowed).toBe(true);
  });

  it("remaining berkurang sesuai percobaan", () => {
    const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxAttempts: 2 });
    const first = limiter.check("k");
    expect(first.remaining).toBe(1);
    const second = limiter.check("k");
    expect(second.remaining).toBe(0);
  });
});

describe("loginRateLimiter default", () => {
  beforeEach(() => {
    loginRateLimiter.reset("tes@contoh.dev:1.2.3.4");
  });

  it("konfigurasi login: 10 percobaan per 15 menit", () => {
    const key = "tes@contoh.dev:1.2.3.4";
    for (let i = 0; i < 10; i++) {
      expect(loginRateLimiter.check(key).allowed).toBe(true);
    }
    expect(loginRateLimiter.check(key).allowed).toBe(false);
  });
});
