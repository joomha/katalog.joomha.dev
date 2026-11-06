import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateCertificatePdf } from "@/modules/learning/services/certificate-pdf";

type RouteContext = { params: Promise<{ code: string }> };
export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  if (!/^[a-f0-9]{36}$/.test(code)) return NextResponse.json({ error: "Sertifikat tidak ditemukan." }, { status: 404 });
  const certificate = await prisma.learningCertificate.findUnique({
    where: { verificationCode: code },
    select: {
      certificateNumber: true, participantNameSnapshot: true, courseTitleSnapshot: true,
      issuerNameSnapshot: true, issuedAt: true, verificationUrl: true, status: true, revokedAt: true,
    },
  });
  if (!certificate || certificate.status !== "ISSUED" || certificate.revokedAt || !certificate.issuedAt) {
    return NextResponse.json({ error: "Sertifikat tidak ditemukan atau sudah tidak berlaku." }, { status: 404 });
  }
  const pdf = generateCertificatePdf({
    participantName: certificate.participantNameSnapshot,
    courseTitle: certificate.courseTitleSnapshot,
    certificateNumber: certificate.certificateNumber,
    issuerName: certificate.issuerNameSnapshot,
    issuedAt: certificate.issuedAt,
    verificationUrl: certificate.verificationUrl ?? "",
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=" + certificate.certificateNumber + ".pdf",
      "Cache-Control": "private, no-store",
      "Content-Length": String(pdf.length),
    },
  });
}
