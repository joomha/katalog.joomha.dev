import Link from "next/link";
import { Metadata } from "next";
import { 
  Layers, 
  ExternalLink, 
  GraduationCap, 
  FileText, 
  Briefcase, 
  Info,
  ArrowLeft
} from "lucide-react";
import { listCatalogItems } from "@/modules/catalog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin — Manajemen Katalog | Joomha Education",
  description: "Daftar inventaris 45 listing katalog Joomha Education.",
};

export default async function AdminCatalogPage() {
  // Fetch all 45 items with limit 100
  const result = await listCatalogItems({ limit: 100 });
  const items = result.data;

  const courseCount = items.filter((i) => i.type === "SELF_PACED_COURSE").length;
  const digitalCount = items.filter((i) => i.type === "DIGITAL_PRODUCT").length;
  const serviceCount = items.filter((i) => i.type === "BUSINESS_SERVICE").length;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Layers className="h-3.5 w-3.5" />
              Agent 03 Integration Point
            </span>
            <span className="text-xs text-muted-foreground">Read-Only Inventory View</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Daftar Inventaris Katalog (45 Item)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Data dikelola terpusat dari modul katalog (`src/modules/catalog`) dengan fallback database PostgreSQL / Prisma ORM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Ke Beranda
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/katalog" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Lihat Storefront Publik
            </Link>
          </Button>
        </div>
      </div>

      {/* Integration Documentation Note */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-4 sm:p-5 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm text-foreground">
          <strong className="font-semibold text-blue-900 dark:text-blue-300">
            Catatan Integrasi Modul & Guard Hak Akses (Agent 02 & Agent 09):
          </strong>
          <p className="text-muted-foreground leading-relaxed">
            Halaman ini menyediakan inspeksi listing katalog untuk verifikasi data publik. Formulir CRUD interaktif (tambah/edit/arsip listing, unggah berkas final produk digital) akan disediakan oleh <strong>Agent 09 (Admin Panel & Platform Ops)</strong>. Otentikasi dan pengecekan role `ADMIN`/`SUPERADMIN` akan diproteksi menggunakan modul identitas dari <strong>Agent 02</strong> saat migrasi penuh selesai.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Total Listing
          </span>
          <div className="text-2xl font-black text-foreground">{items.length}</div>
          <span className="text-[11px] text-muted-foreground">Idempotent Seed</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            Kelas Online
          </span>
          <div className="text-2xl font-black text-foreground">{courseCount}</div>
          <span className="text-[11px] text-muted-foreground">Status: COMING_SOON</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Produk Digital
          </span>
          <div className="text-2xl font-black text-foreground">{digitalCount}</div>
          <span className="text-[11px] text-muted-foreground">File Final: Pending Upload</span>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-1">
          <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            Jasa Digitalisasi
          </span>
          <div className="text-2xl font-black text-foreground">{serviceCount}</div>
          <span className="text-[11px] text-muted-foreground">Status: AVAILABLE</span>
        </div>
      </div>

      {/* Table of items */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground">
            Daftar Lengkap 45 Item Listing
          </h2>
          <span className="text-xs text-muted-foreground">
            {items.length} dari 45 item dimuat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Judul & Slug</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Bidang</th>
                <th className="py-3 px-4">Harga Label</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => {
                const isComingSoon = item.status === "COMING_SOON";
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{item.slug}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {item.field}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                      {item.priceLabel}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isComingSoon
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <Link href={`/katalog/${item.slug}`} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Pratinjau
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

