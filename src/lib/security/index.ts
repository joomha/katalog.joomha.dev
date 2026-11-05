import crypto from "crypto";

/**
 * Generic security baseline helpers.
 * Does not implement domain auth/RBAC (which is owned by Agent 02).
 */

/**
 * Generate a cryptographically secure random token (hex string).
 */
export function generateSecureToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Basic HTML/string sanitization helper for public input.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

