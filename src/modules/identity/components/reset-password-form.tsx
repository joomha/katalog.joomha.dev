"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, type FormState } from "../actions";

/** Form reset kata sandi dengan token sekali pakai dari email. */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(resetPasswordAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <label htmlFor="reset-password" className="text-sm font-medium leading-none">
          Kata Sandi Baru
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          placeholder="Minimal 8 karakter, huruf dan angka"
          aria-describedby="reset-password-hint"
        />
        <p id="reset-password-hint" className="text-xs text-muted-foreground">
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
        <Link href="/lupa-sandi" className="font-medium text-primary hover:underline">
          Minta tautan reset baru
        </Link>
      </p>
    </form>
  );
}
