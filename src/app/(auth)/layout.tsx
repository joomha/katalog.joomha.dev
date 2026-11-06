import type { ReactNode } from "react";

/**
 * Layout grup route (auth) — halaman masuk, daftar, lupa/reset sandi.
 * Tampilan sederhana, fokus aksesibilitas dan mobile-first.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Joomha Education</p>
          <p className="mt-1 text-xs text-muted-foreground">Digital Learning &amp; Business Solutions</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
