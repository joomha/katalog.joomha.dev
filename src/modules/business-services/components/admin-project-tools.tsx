"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminProjectTools({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function addProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      message: String(form.get("message") ?? ""),
      visibility: String(form.get("visibility") ?? "CUSTOMER"),
      progress: form.get("progress") ? Number(form.get("progress")) : undefined,
    };
    try {
      const response = await fetch(`/api/business-services/projects/${projectId}/progress`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Update progres belum tersimpan.");
      setMessage("Update progres berhasil ditambahkan."); formElement.reset(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  async function addDeliverable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      type: String(form.get("type") ?? "LINK"),
      externalUrl: String(form.get("externalUrl") ?? "") || undefined,
    };
    try {
      const response = await fetch(`/api/business-services/projects/${projectId}/deliverables`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Deliverable belum tersimpan.");
      setMessage("Deliverable berhasil ditambahkan dan menunggu review customer."); formElement.reset(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  async function startHandover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch(`/api/business-services/projects/${projectId}/handover`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handoverSummary: String(form.get("handoverSummary") ?? "") }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Serah terima belum diajukan.");
      setMessage("Proyek diajukan ke tahap review serah terima."); formElement.reset(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  return <section className="space-y-3">
    {(error || message) && <div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}</div>}
    <div className="grid gap-4 lg:grid-cols-3">
      <form onSubmit={addProgress} className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Tambah update progres</h2>
        <label className="block space-y-1 text-sm"><span>Pesan *</span><textarea name="message" required minLength={3} rows={3} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1 text-sm"><span>Visibilitas</span><select name="visibility" className="w-full rounded-md border bg-background px-3 py-2"><option value="CUSTOMER">Terlihat pelanggan</option><option value="INTERNAL">Internal saja</option></select></label>
        <label className="block space-y-1 text-sm"><span>Progres (%)</span><input name="progress" type="number" min="0" max="100" className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <button disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Simpan update</button>
      </form>
      <form onSubmit={addDeliverable} className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Tambah deliverable</h2>
        <label className="block space-y-1 text-sm"><span>Judul *</span><input name="title" required minLength={3} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1 text-sm"><span>Deskripsi *</span><textarea name="description" required minLength={3} rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <label className="block space-y-1 text-sm"><span>Jenis</span><select name="type" className="w-full rounded-md border bg-background px-3 py-2"><option value="LINK">Tautan</option><option value="DESCRIPTION">Keterangan</option></select></label>
        <label className="block space-y-1 text-sm"><span>URL (untuk tautan)</span><input name="externalUrl" type="url" className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <button disabled={busy} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Tambah deliverable</button>
      </form>
      <form onSubmit={startHandover} className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Ajukan serah terima</h2>
        <label className="block space-y-1 text-sm"><span>Ringkasan akhir *</span><textarea name="handoverSummary" required minLength={10} rows={5} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <p className="text-xs text-muted-foreground">Pelanggan dapat mengonfirmasi serah terima dari halaman proyek.</p>
        <button disabled={busy} className="rounded-md border px-3 py-2 text-sm font-semibold disabled:opacity-50">Ajukan review serah terima</button>
      </form>
    </div>
  </section>;
}
