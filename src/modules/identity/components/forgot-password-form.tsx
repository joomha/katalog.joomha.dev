"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, type FormState } from "../actions";

/** Form permintaan reset kata sandi. Respons selalu generik (anti-enumeration). */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Mengirim..." : "Kirim Tautan Reset"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(forgotPasswordAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="forgot-email" className="text-sm font-medium leading-none">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          placeholder="nama@email.com"
          aria-describedby={state?.fieldErrors?.email ? "forgot-email-error" : undefined}
        />
        {state?.fieldErrors?.email ? (
          <p id="forgot-email-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      {state?.error && !state.fieldErrors ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/masuk" className="font-medium text-primary hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </form>
  );
}
