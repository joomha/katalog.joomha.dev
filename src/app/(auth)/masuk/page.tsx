import type { Metadata } from "next";
import { LoginForm } from "@/modules/identity/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Joomha Education Anda.",
};

interface MasukPageProps {
  searchParams: Promise<{ next?: string; status?: string }>;
}

const STATUS_MESSAGES: Record<string, string> = {
  terdaftar: "Pendaftaran berhasil. Silakan masuk dengan email dan kata sandi Anda.",
  "reset-berhasil": "Kata sandi berhasil diganti. Silakan masuk dengan kata sandi baru.",
  logout: "Anda telah keluar dari akun.",
};

export default async function MasukPage({ searchParams }: MasukPageProps) {
  const params = await searchParams;
  const nextUrl =
    typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;
  const statusMessage = params.status ? STATUS_MESSAGES[params.status] : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Masuk ke Akun Anda</h1>
        <p className="text-sm text-muted-foreground">
          Satu akun untuk katalog, kelas, les privat, dan jasa digitalisasi.
        </p>
      </div>

      {statusMessage ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-foreground" role="status">
          {statusMessage}
        </p>
      ) : null}

      <LoginForm nextUrl={nextUrl} />
    </div>
  );
}
