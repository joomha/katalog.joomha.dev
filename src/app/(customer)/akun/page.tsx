import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/identity/guards";

export const metadata: Metadata = {
  title: "Ringkasan Akun",
};

const UPCOMING_SECTIONS: { title: string; description: string }[] = [
  {
    title: "Pesanan & Pembelian",
    description: "Riwayat pesanan produk digital dan kelas akan tersedia di sini.",
  },
  {
    title: "Kelas Saya",
    description: "Kelas mandiri yang Anda ikuti beserta progres belajar akan tampil di sini.",
  },
  {
    title: "Sertifikat",
    description: "Sertifikat penyelesaian kelas akan terkumpul di sini.",
  },
  {
    title: "Konsultasi & Proyek",
    description: "Riwayat konsultasi AI, penawaran les privat, dan proyek jasa akan tampil di sini.",
  },
];

export default async function AkunPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Data Akun</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nama</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">
              {user.email}
              {user.emailVerified ? (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Terverifikasi
                </span>
              ) : (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Belum terverifikasi
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nomor telepon</dt>
            <dd className="font-medium">{user.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Terdaftar sejak</dt>
            <dd className="font-medium">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(user.createdAt)}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm">
          <Link href="/akun/profil" className="font-medium text-primary hover:underline">
            Ubah profil dan kelola alamat
          </Link>
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {UPCOMING_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-dashed border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Segera
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
