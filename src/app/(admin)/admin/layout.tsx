import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminAccess, getCurrentUserAccess } from "@/modules/identity/guards";
import { PERMISSIONS, type PermissionKey } from "@/modules/identity/permissions";
import { LogoutButton } from "@/modules/identity/components/logout-button";
import { AccessDeniedError } from "@/modules/identity/types";

/**
 * Admin root layout (Agent 02) — shell + route guard untuk seluruh /admin.
 * Agent 03–09 menambahkan halaman domain mereka di subfolder /admin/<domain>
 * tanpa mengubah file ini; guard server-side selalu aktif di sini.
 */

interface NavItem {
  label: string;
  href: string;
  permission: PermissionKey | "always";
  owner?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Ringkasan", href: "/admin", permission: "always" },
  { label: "Katalog Produk", href: "/admin/katalog", permission: PERMISSIONS.CATALOG_VIEW, owner: "Modul Katalog" },
  { label: "Pesanan & Pembayaran", href: "/admin/pesanan", permission: PERMISSIONS.ORDERS_VIEW, owner: "Modul Commerce" },
  { label: "Pembelajaran (LMS)", href: "/admin/pembelajaran", permission: PERMISSIONS.LEARNING_VIEW, owner: "Modul LMS" },
  { label: "Les Privat", href: "/admin/les-privat", permission: PERMISSIONS.TUTORING_VIEW, owner: "Modul Tutoring" },
  { label: "Jasa Digitalisasi", href: "/admin/jasa", permission: PERMISSIONS.BUSINESS_VIEW, owner: "Modul Business Services" },
  { label: "Konsultasi AI", href: "/admin/konsultasi", permission: PERMISSIONS.CONSULTATION_VIEW, owner: "Modul AI Consultant" },
  { label: "Pengguna & Akses", href: "/admin/pengguna", permission: PERMISSIONS.USERS_VIEW, owner: "Modul Identity" },
  { label: "Platform & Audit", href: "/admin/platform", permission: PERMISSIONS.PLATFORM_VIEW, owner: "Modul Platform" },
];

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Pelanggan",
  STUDENT: "Murid",
  INSTRUCTOR: "Instruktur",
  ADMIN: "Admin",
  SUPERADMIN: "Superadmin",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let admin;
  try {
    admin = await requireAdminAccess();
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      // Terotentikasi tetapi bukan sisi admin → jujur, tanpa membocorkan isi admin.
      return (
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
            <h1 className="text-lg font-semibold">Akses Ditolak</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Akun Anda tidak memiliki izin membuka dasbor admin. Jika ini tidak seharusnya,
              hubungi superadmin Joomha.
            </p>
            <p className="mt-4">
              <Link href="/akun" className="text-sm font-medium text-primary hover:underline">
                Kembali ke Akun Saya
              </Link>
            </p>
          </div>
        </main>
      );
    }
    throw error;
  }

  const access = await getCurrentUserAccess();
  const permissions = new Set(access?.permissions ?? []);
  const isSuperadmin = admin.roles.includes("SUPERADMIN");

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permission === "always" || isSuperadmin || permissions.has(item.permission)
  );

  const roleLabels = admin.roles.map((r) => ROLE_LABELS[r] ?? r).join(" · ");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-semibold tracking-tight">
              <span className="text-primary">Joomha</span> Admin
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="font-medium leading-tight">{admin.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabels}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 text-center text-sm font-semibold leading-8 text-primary" aria-hidden>
              {admin.name.slice(0, 1).toUpperCase()}
            </div>
            <LogoutButton compact />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav
          aria-label="Navigasi admin"
          className="w-full shrink-0 border-b border-border bg-card px-3 py-4 lg:w-64 lg:border-b-0 lg:border-r"
        >
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {visibleItems.map((item) => {
              const isAvailable = item.href === "/admin";
              const linkClass =
                "block whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
              if (isAvailable) {
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.href} className="flex items-center">
                  <span className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/70" aria-disabled="true">
                    {item.label}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Segera</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Konten */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
