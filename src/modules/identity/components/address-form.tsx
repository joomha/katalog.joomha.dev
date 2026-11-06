"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
  type FormState,
} from "../actions";
import type { SafeUserAddress } from "../types";

/** Form alamat (tambah/edit) dengan consent pemakaian untuk layanan offline. */

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Menyimpan..." : label}
    </Button>
  );
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function AddressFields({
  address,
}: {
  address?: Pick<
    SafeUserAddress,
    "id" | "label" | "recipientName" | "phone" | "province" | "city" | "district" | "postalCode" | "fullAddress" | "notes" | "isDefault" | "serviceUseConsentAt"
  >;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-label-${address?.id ?? "new"}`}>
            Label Alamat
          </label>
          <input
            id={`addr-label-${address?.id ?? "new"}`}
            name="label"
            type="text"
            required
            maxLength={50}
            defaultValue={address?.label ?? ""}
            className={inputClass}
            placeholder="Rumah / Kantor"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-recipient-${address?.id ?? "new"}`}>
            Nama Penerima <span className="text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`addr-recipient-${address?.id ?? "new"}`}
            name="recipientName"
            type="text"
            maxLength={100}
            defaultValue={address?.recipientName ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-phone-${address?.id ?? "new"}`}>
            Telepon <span className="text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`addr-phone-${address?.id ?? "new"}`}
            name="phone"
            type="tel"
            defaultValue={address?.phone ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-postal-${address?.id ?? "new"}`}>
            Kode Pos <span className="text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`addr-postal-${address?.id ?? "new"}`}
            name="postalCode"
            type="text"
            maxLength={10}
            defaultValue={address?.postalCode ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-province-${address?.id ?? "new"}`}>
            Provinsi <span className="text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`addr-province-${address?.id ?? "new"}`}
            name="province"
            type="text"
            maxLength={100}
            defaultValue={address?.province ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-city-${address?.id ?? "new"}`}>
            Kota/Kabupaten <span className="text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`addr-city-${address?.id ?? "new"}`}
            name="city"
            type="text"
            maxLength={100}
            defaultValue={address?.city ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor={`addr-district-${address?.id ?? "new"}`}>
            Kecamatan <span className="text-muted-foreground">(opsional)</span>
          </label>
          <input
            id={`addr-district-${address?.id ?? "new"}`}
            name="district"
            type="text"
            maxLength={100}
            defaultValue={address?.district ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor={`addr-full-${address?.id ?? "new"}`}>
          Alamat Lengkap
        </label>
        <textarea
          id={`addr-full-${address?.id ?? "new"}`}
          name="fullAddress"
          required
          maxLength={500}
          rows={3}
          defaultValue={address?.fullAddress ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Nama jalan, nomor, RT/RW, kelurahan"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor={`addr-notes-${address?.id ?? "new"}`}>
          Catatan <span className="text-muted-foreground">(opsional)</span>
        </label>
        <input
          id={`addr-notes-${address?.id ?? "new"}`}
          name="notes"
          type="text"
          maxLength={300}
          defaultValue={address?.notes ?? ""}
          className={inputClass}
          placeholder="Patokan, jam kunjungan, dsb."
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={address?.isDefault ?? false}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>Jadikan alamat utama</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consentToServiceUse"
            defaultChecked={address?.serviceUseConsentAt != null}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            Saya setuju alamat ini dipakai untuk layanan yang saya minta sendiri (mis. sesi les
            offline atau pengerjaan jasa di lokasi).
          </span>
        </label>
      </div>
    </>
  );
}

export function CreateAddressForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createAddressAction, {});
  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-5" noValidate>
      <h3 className="text-sm font-semibold">Tambah Alamat Baru</h3>
      <AddressFields />
      {state?.error && !state.fieldErrors ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <SubmitButton label="Simpan Alamat" />
    </form>
  );
}

export function EditAddressForm({ address }: { address: SafeUserAddress }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    (prev, formData) => updateAddressAction(prev, formData),
    {}
  );
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="addressId" value={address.id} />
      <AddressFields address={address} />
      {state?.error && !state.fieldErrors ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <SubmitButton label="Perbarui Alamat" />
    </form>
  );
}

export function DeleteAddressButton({ addressId }: { addressId: string }) {
  const [, formAction] = useActionState<FormState, FormData>(deleteAddressAction, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="addressId" value={addressId} />
      <SubmitButton label="Hapus" />
    </form>
  );
}
