import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyCertificate } from "@/modules/learning/services";

type PageProps = { params: Promise<{ code: string }> };
export const metadata: Metadata = { title: "Verifikasi Sertifikat | Joomha Education" };
export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params;
  const certificate = await verifyCertificate(code);
  if (!certificate) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <section className="rounded-2xl border bg-card p-7 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Joomha Education</p>
        <h1 className="mt-3 text-2xl font-bold">Verifikasi Sertifikat</h1>
        <p className={"mt-5 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold " + (certificate.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{certificate.isValid ? "Sertifikat valid" : "Sertifikat tidak berlaku"}</p>
        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Nama peserta</dt><dd className="mt-1 font-semibold">{certificate.participantNameSnapshot}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Nomor sertifikat</dt><dd className="mt-1 font-semibold">{certificate.certificateNumber}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Kursus</dt><dd className="mt-1 font-semibold">{certificate.courseTitleSnapshot}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Penerbit</dt><dd className="mt-1">{certificate.issuerNameSnapshot}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Tanggal terbit</dt><dd className="mt-1">{certificate.issuedAt?.toLocaleDateString("id-ID", { dateStyle: "long" }) ?? "—"}</dd></div>
        </dl>
        {!certificate.isValid && certificate.revocationReason && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{certificate.revocationReason}</p>}
        {certificate.isValid && <a href={"/api/learning/certificates/" + certificate.verificationCode + "/pdf"} className="mt-7 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Unduh PDF</a>}
      </section>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">Sertifikat ini adalah bukti penyelesaian internal Joomha Education dan bukan sertifikasi kompetensi resmi/BNSP.</p>
      <Link href="/" className="mt-5 inline-block text-sm text-primary hover:underline">Kembali ke beranda</Link>
    </main>
  );
}
