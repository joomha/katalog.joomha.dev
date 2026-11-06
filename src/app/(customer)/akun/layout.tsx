import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/modules/identity/guards";
import { getCurrentUserAccess } from "@/modules/identity/guards";

/**
 * Account shell /akun — milik Agent 02. Domain lain (Agent 04–09) menambahkan
 * subroute miliknya di bawah (customer) tanpa mengubah shell ini.
 */

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/akun", label: "Ringkasan" },
  { href: "/akun/profil", label: "Profil & Alamat" },
  { href: "/akun/keamanan", label: "Keamanan" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const access = await getCurrentUserAccess();
  const isAdminSide =
    user.roles.some((r) => r === "ADMIN" || r === "SUPERADMIN" || r === "INSTRUCTOR");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Akun Saya</p>
        <h1 className="text-2xl font-semibold tracking-tight">Halo, {user.name}</h1>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Navigasi akun" className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {isAdminSide ? (
              <li>
                <Link
                  href="/admin"
                  className="block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
                >
                  Dasbor Admin
                </Link>
              </li>
            ) : null}
          </ul>

          <div className="mt-4 rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
            Bagian lain (Pesanan, Kelas Saya, Sertifikat, Riwayat Konsultasi) akan tersedia
            seiring modul terkait dirilis.
          </div>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
        Role Anda: {access?.user.roles.join(", ") || "—"} · Zona waktu:{" "}
        {user.timezone ?? "Asia/Jakarta"}
      </footer>
    </div>
  );
}
