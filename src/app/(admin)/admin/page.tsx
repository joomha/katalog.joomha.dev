import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminAccess, getCurrentUserAccess } from "@/modules/identity/guards";

export const metadata: Metadata = {
  title: "Dasbor Admin",
};

const PLANNED_SECTIONS: { title: string; description: string; owner: string }[] = [
  { title: "Katalog Produk", description: "Kelola listing produk, kelas, dan jasa (45 listing awal).", owner: "Agent 03" },
  { title: "Pesanan & Pembayaran", description: "Pantau keranjang, order, pembayaran, dan refund.", owner: "Agent 04" },
  { title: "Pembelajaran (LMS)", description: "Kelola kursus, chapter, lesson, evaluasi, dan sertifikat.", owner: "Agent 05" },
  { title: "Les Privat", description: "Kelola penawaran les, jadwal, sesi, dan kehadiran.", owner: "Agent 06" },
  { title: "Jasa Digitalisasi", description: "Kelola permintaan, proposal, proyek, dan milestone.", owner: "Agent 07" },
  { title: "Konsultasi AI", description: "Pantau percakapan AI, handoff, dan takeover admin.", owner: "Agent 08" },
  { title: "Platform & Audit", description: "Notifikasi, audit log, file, dan konfigurasi sistem.", owner: "Agent 09" },
];

/**
 * Placeholder ringkasan admin yang jujur: tanpa data palsu dan tanpa tombol
 * inert. Setiap modul domain akan menggantikan/menambah halaman bagianya.
 */
export default async function AdminHomePage() {
  const admin = await requireAdminAccess();
  const access = await getCurrentUserAccess();
  const permissions = access?.permissions ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">Ringkasan Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selamat datang, {admin.name}. Ringkasan operasional (penjualan, order, konsultasi)
          akan tersedia setelah modul domain terkait terhubung.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Akses Anda</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Role: <span className="font-medium text-foreground">{admin.roles.join(", ")}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Permission aktif: {admin.roles.includes("SUPERADMIN") ? "semua (superadmin)" : permissions.length}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Modul Terpasang</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANNED_SECTIONS.map((section) => (
            <div key={section.title} className="rounded-lg border border-dashed border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{section.title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Segera</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{section.description}</p>
              <p className="mt-2 text-xs text-muted-foreground/80">Pemilik modul: {section.owner}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        Ingin mengelola profil pribadi?{" "}
        <Link href="/akun" className="font-medium text-primary hover:underline">
          Buka Akun Saya
        </Link>
      </p>
    </div>
  );
}
