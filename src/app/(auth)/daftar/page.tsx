import type { Metadata } from "next";
import { RegisterForm } from "@/modules/identity/components/register-form";

export const metadata: Metadata = {
  title: "Daftar Akun",
  description: "Buat akun Joomha Education — satu akun untuk semua layanan.",
};

export default function DaftarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Buat Akun Baru</h1>
        <p className="text-sm text-muted-foreground">
          Satu akun untuk membeli produk, mengikuti kelas, dan memakai semua layanan Joomha.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
