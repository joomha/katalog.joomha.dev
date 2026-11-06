"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loginAction, type FormState } from "../actions";

/**
 * Form login (client) — state via useActionState, submit via server action,
 * status pending via useFormStatus. Aksesibel: label, aria-describedby error.
 */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Memproses..." : "Masuk"}
    </Button>
  );
}

export function LoginForm({ nextUrl }: { nextUrl?: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {nextUrl ? <input type="hidden" name="next" value={nextUrl} /> : null}

      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-medium leading-none">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          placeholder="nama@email.com"
          aria-describedby={state?.fieldErrors?.email ? "login-email-error" : undefined}
        />
        {state?.fieldErrors?.email ? (
          <p id="login-email-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="login-password" className="text-sm font-medium leading-none">
          Kata Sandi
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          placeholder="Kata sandi Anda"
          aria-describedby={state?.fieldErrors?.password ? "login-password-error" : undefined}
        />
        {state?.fieldErrors?.password ? (
          <p id="login-password-error" className="text-xs text-destructive" role="alert">
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

      <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
        <Link href="/lupa-sandi" className="hover:text-foreground">
          Lupa kata sandi?
        </Link>
        <p>
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-medium text-primary hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </form>
  );
}
