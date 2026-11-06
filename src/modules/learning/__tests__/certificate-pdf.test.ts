import { describe, expect, it } from "vitest";
import { generateCertificatePdf } from "../services/certificate-pdf";

describe("certificate PDF", () => {
  it("generates a PDF document containing the certificate identifier", () => {
    const pdf = generateCertificatePdf({
      participantName: "Peserta Joomha",
      courseTitle: "Microsoft Excel Basic",
      certificateNumber: "JH-2026-ABCDE12345",
      issuerName: "Joomha Education",
      issuedAt: new Date("2026-11-06T00:00:00.000Z"),
      verificationUrl: "https://edu.joomha.dev/verifikasi-sertifikat/abcdef",
    });
    expect(pdf.subarray(0, 8).toString("latin1")).toContain("%PDF-1.4");
    expect(pdf.toString("latin1")).toContain("JH-2026-ABCDE12345");
    expect(pdf.toString("latin1")).toContain("Microsoft Excel Basic");
  });
});
