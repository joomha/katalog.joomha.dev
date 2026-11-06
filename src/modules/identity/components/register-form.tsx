"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { registerAction, type FormState } from "../actions";

/** Form registrasi (client). Setelah sukses, server action mengalihkan ke /akun. */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Mendaftarkan..." : "Daftar"}
    </Button>
  );
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function RegisterForm() {
  const [state, formAction] = useActionState<FormState, FormData>(registerAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="register-name" className="text-sm font-medium leading-none">
          Nama Lengkap
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={inputClass}
          placeholder="Nama yang ditampilkan"
          aria-describedby={state?.fieldErrors?.name ? "register-name-error" : undefined}
        />
        {state?.fieldErrors?.name ? (
          <p id="register-name-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="register-email" className="text-sm font-medium leading-none">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          placeholder="nama@email.com"
          aria-describedby={state?.fieldErrors?.email ? "register-email-error" : undefined}
        />
        {state?.fieldErrors?.email ? (
          <p id="register-email-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="register-password" className="text-sm font-medium leading-none">
          Kata Sandi
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
          placeholder="Minimal 8 karakter, huruf dan angka"
          aria-describedby="register-password-hint"
        />
        <p id="register-password-hint" className="text-xs text-muted-foreground">
          Minimal 8 karakter, harus mengandung huruf dan angka.
        </p>
        {state?.fieldErrors?.password ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state?.error && !state.fieldErrors ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Dengan mendaftar, Anda menyetujui ketentuan layanan dan kebijakan privasi Joomha Education.
      </p>
    </form>
  );
}
