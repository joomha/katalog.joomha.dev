import { describe, it, expect } from "vitest";
import { cn, formatRupiah, truncate } from "@/lib/utils";

describe("Core Utility Primitives", () => {
  it("cn merges Tailwind class names without conflict", () => {
    const result = cn("px-2 py-1", "bg-red-500", { "text-white": true, "px-4": true });
    expect(result).toContain("py-1");
    expect(result).toContain("bg-red-500");
    expect(result).toContain("text-white");
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2"); // overridden by px-4
  });

  it("formatRupiah formats numeric values into Indonesian currency format", () => {
    const formatted = formatRupiah(150000);
    expect(formatted).toMatch(/Rp\s?150\.000/);
  });

  it("truncate cuts strings longer than max length with ellipsis", () => {
    expect(truncate("Halo Dunia", 4)).toBe("Halo...");
    expect(truncate("Singkat", 20)).toBe("Singkat");
  });
});

