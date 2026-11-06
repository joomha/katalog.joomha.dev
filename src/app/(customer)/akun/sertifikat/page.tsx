import type { Metadata } from "next";
import Link from "next/link";
import { listMyCertificates } from "@/modules/learning/services";

export const metadata: Metadata = { title: "Sertifikat Saya | Joomha Education" };
export default async function MyCertificatesPage() {
  const certificates = await listMyCertificates();
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Sertifikat Saya</h2><p className="mt-2 text-sm text-muted-foreground">Sertifikat penyelesaian kursus yang diterbitkan.</p></div>
      {!certificates.length ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada sertifikat yang diterbitkan.</div> :
      <div className="space-y-3">{certificates.map((certificate) => <article key={certificate.certificateNumber} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div><h3 className="font-semibold">{certificate.courseTitleSnapshot}</h3><p className="mt-1 text-xs text-muted-foreground">{certificate.certificateNumber} · {certificate.status}</p></div>
        <div className="flex gap-3"><Link href={"/verifikasi-sertifikat/" + certificate.verificationCode} className="text-sm font-medium text-primary hover:underline">Verifikasi</Link>
          {certificate.status === "ISSUED" && <a href={"/api/learning/certificates/" + certificate.verificationCode + "/pdf"} className="text-sm font-medium text-primary hover:underline">Unduh PDF</a>}
        </div>
      </article>)}</div>}
    </div>
  );
}
