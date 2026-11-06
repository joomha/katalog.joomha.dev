"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { changePasswordAction, type FormState } from "../actions";

/** Form ganti kata sandi (memverifikasi kata sandi saat ini). */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : "Ganti Kata Sandi"}
    </Button>
  );
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(changePasswordAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="current-password" className="text-sm font-medium leading-none">
          Kata Sandi Saat Ini
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
        {state?.fieldErrors?.currentPassword ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.currentPassword}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium leading-none">
          Kata Sandi Baru
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
          placeholder="Minimal 8 karakter, huruf dan angka"
          aria-describedby="new-password-hint"
        />
        <p id="new-password-hint" className="text-xs text-muted-foreground">
          Minimal 8 karakter, harus mengandung huruf dan angka.
        </p>
        {state?.fieldErrors?.newPassword ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.newPassword}
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
          {state.success}{" "}
          Untuk keamanan, sebaiknya masuk ulang di perangkat lain yang Anda curigai.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
