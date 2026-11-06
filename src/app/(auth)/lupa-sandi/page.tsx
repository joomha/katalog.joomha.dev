import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/modules/identity/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Minta tautan reset kata sandi untuk akun Joomha Education Anda.",
};

export default function LupaSandiPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Lupa Kata Sandi?</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan email akun Anda. Kami akan mengirim tautan untuk mengganti kata sandi.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
