import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/modules/identity/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Kata Sandi",
  description: "Tetapkan kata sandi baru untuk akun Joomha Education Anda.",
};

interface ResetSandiPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetSandiPage({ searchParams }: ResetSandiPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Buat Kata Sandi Baru</h1>
        <p className="text-sm text-muted-foreground">
          Tautan ini hanya berlaku satu kali dan dalam batas waktu tertentu.
        </p>
      </div>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4 text-center">
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            Tautan reset tidak valid. Silakan minta tautan baru.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/lupa-sandi">Minta Tautan Reset Baru</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
