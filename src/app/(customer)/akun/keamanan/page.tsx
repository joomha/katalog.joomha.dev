import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/guards";
import { ChangePasswordForm } from "@/modules/identity/components/change-password-form";
import { LogoutButton } from "@/modules/identity/components/logout-button";

export const metadata: Metadata = {
  title: "Keamanan Akun",
};

export default async function KeamananPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Ganti Kata Sandi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gunakan kata sandi yang unik dan tidak dipakai di layanan lain.
        </p>
        <div className="mt-5 max-w-md">
          <ChangePasswordForm />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Sesi Aktif</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sesi login bertahan paling lama 30 hari di perangkat ini. Menekan tombol keluar hanya
          mengakhiri sesi di perangkat ini; jika Anda keluar di perangkat lain, gunakan ganti kata
          sandi.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Login terakhir:{" "}
          {user.createdAt
            ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                user.createdAt
              )
            : "—"}
        </p>
        <div className="mt-4 max-w-xs">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
