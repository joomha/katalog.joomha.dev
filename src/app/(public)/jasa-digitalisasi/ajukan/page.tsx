import type { Metadata } from "next";
import { BusinessRequestForm } from "@/modules/business-services/components/business-request-form";
import { listBusinessServiceDefinitions } from "@/modules/business-services";

export const metadata: Metadata = { title: "Ajukan Kebutuhan Digitalisasi" };

export default async function RequestBusinessServicePage({
  searchParams,
}: {
  searchParams: Promise<{ layanan?: string }>;
}) {
  const params = await searchParams;
  const services = await listBusinessServiceDefinitions();
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Joomha Business Solutions</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ceritakan kebutuhan digitalisasi Anda</h1>
        <p className="max-w-2xl text-muted-foreground">Belum tahu harus memakai aplikasi atau layanan apa? Tidak masalah. Jelaskan proses dan kendala yang dihadapi; tim akan membantu meninjau kemungkinan solusinya sebelum menyusun proposal.</p>
      </div>
      <BusinessRequestForm services={services.map((service) => ({ slug: service.slug, title: service.title }))} defaultServiceSlug={params.layanan ?? ""} />
    </main>
  );
}
