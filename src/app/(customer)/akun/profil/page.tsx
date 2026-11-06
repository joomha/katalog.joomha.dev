import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/guards";
import { listOwnAddresses } from "@/modules/identity/services/profile.service";
import { ProfileForm } from "@/modules/identity/components/profile-form";
import { CreateAddressForm, EditAddressForm } from "@/modules/identity/components/address-form";

export const metadata: Metadata = {
  title: "Profil & Alamat",
};

export default async function ProfilPage() {
  const user = await requireUser();
  const addresses = await listOwnAddresses(user.id);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nama, kontak, dan preferensi tampilan akun Anda.
        </p>
        <div className="mt-5">
          <ProfileForm
            initial={{ name: user.name, phone: user.phone, timezone: user.timezone }}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Alamat untuk Layanan Offline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Alamat hanya dipakai untuk layanan yang Anda minta sendiri (les offline atau jasa di
          lokasi) dan hanya dibagikan kepada instruktur/teknisi yang ditugaskan.
        </p>

        <div className="mt-5 space-y-5">
          {addresses.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Belum ada alamat tersimpan.
            </p>
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="rounded-md border border-border p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{address.label}</span>
                  {address.isDefault ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Alamat utama
                    </span>
                  ) : null}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {address.serviceUseConsentAt ? "Setuju dipakai layanan" : "Tidak dipakai layanan"}
                  </span>
                </div>
                <EditAddressForm address={address} />
              </div>
            ))
          )}

          <CreateAddressForm />
        </div>
      </section>
    </div>
  );
}
