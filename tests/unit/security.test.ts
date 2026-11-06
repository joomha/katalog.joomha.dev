import { describe, it, expect } from "vitest";
import { generateSecureToken, constantTimeCompare, sanitizeString } from "@/lib/security";

describe("Security Primitives", () => {
  it("generateSecureToken generates high entropy hex strings", () => {
    const token1 = generateSecureToken(16);
    const token2 = generateSecureToken(16);
    expect(token1).toHaveLength(32);
    expect(token2).toHaveLength(32);
    expect(token1).not.toBe(token2);
  });

  it("constantTimeCompare compares identical and differing strings correctly", () => {
    expect(constantTimeCompare("secret-token-123", "secret-token-123")).toBe(true);
    expect(constantTimeCompare("secret-token-123", "secret-token-999")).toBe(false);
    expect(constantTimeCompare("secret", "secret-longer")).toBe(false);
  });

  it("sanitizeString escapes dangerous HTML entities", () => {
    const unsafe = `<script>alert("XSS & attack")</script>`;
    const safe = sanitizeString(unsafe);
    expect(safe).not.toContain("<script>");
    expect(safe).toContain("&lt;script&gt;");
    expect(safe).toContain("&quot;XSS &amp; attack&quot;");
  });
});

