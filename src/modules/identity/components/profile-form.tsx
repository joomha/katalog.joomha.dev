"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { updateProfileAction, type FormState } from "../actions";

/** Form update profil sendiri (nama, telepon, zona waktu). */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan Perubahan"}
    </Button>
  );
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function ProfileForm({
  initial: { name, phone, timezone },
}: {
  initial: { name: string; phone: string | null; timezone: string | null };
}) {
  const [state, formAction] = useActionState<FormState, FormData>(updateProfileAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm font-medium leading-none">
          Nama Tampilan
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={name}
          className={inputClass}
          aria-describedby={state?.fieldErrors?.name ? "profile-name-error" : undefined}
        />
        {state?.fieldErrors?.name ? (
          <p id="profile-name-error" className="text-xs text-destructive" role="alert">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-phone" className="text-sm font-medium leading-none">
          Nomor Telepon <span className="text-muted-foreground">(opsional)</span>
        </label>
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={phone ?? ""}
          className={inputClass}
          placeholder="+62 8xx xxxx xxxx"
        />
        <p className="text-xs text-muted-foreground">
          Hanya dipakai untuk keperluan layanan yang Anda minta (mis. konfirmasi jadwal les).
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-timezone" className="text-sm font-medium leading-none">
          Zona Waktu <span className="text-muted-foreground">(opsional)</span>
        </label>
        <select
          id="profile-timezone"
          name="timezone"
          defaultValue={timezone ?? ""}
          className={inputClass}
        >
          <option value="">Default (Asia/Jakarta)</option>
          <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
          <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
          <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
        </select>
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
    </form>
  );
}
