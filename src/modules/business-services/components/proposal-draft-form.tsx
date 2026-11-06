"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const newlineList = (value: FormDataEntryValue | null) => String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);

export function ProposalDraftForm({ requestId, defaultProblem }: { requestId: string; defaultProblem: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const totalAmount = Number(form.get("totalAmount"));
    const days = Number(form.get("estimatedDurationDays"));
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const milestoneTitle = String(form.get("milestoneTitle") ?? "");
    const milestoneDescription = String(form.get("milestoneDescription") ?? "");
    const payload = {
      title: String(form.get("title") ?? ""),
      problemStatement: String(form.get("problemStatement") ?? ""),
      scopeIn: newlineList(form.get("scopeIn")), scopeOut: newlineList(form.get("scopeOut")),
      deliverables: newlineList(form.get("deliverables")),
      timelineSummary: String(form.get("timelineSummary") ?? ""),
      estimatedDurationDays: days, totalAmount, currency: "IDR",
      milestones: [{ title: milestoneTitle, description: milestoneDescription, sequence: 1, acceptanceCriteria: newlineList(form.get("milestoneCriteria")) }],
      paymentTerms: [{ label: String(form.get("paymentLabel") ?? "Termin pertama"), sequence: 1, amount: totalAmount }],
      assumptions: newlineList(form.get("assumptions")),
      customerDependencies: newlineList(form.get("customerDependencies")),
      acceptanceCriteria: newlineList(form.get("acceptanceCriteria")),
      exclusions: newlineList(form.get("exclusions")),
      validUntil,
    };
    try {
      const response = await fetch(`/api/business-services/requests/${requestId}/proposals`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Draft proposal belum tersimpan.");
      formElement.reset(); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Terjadi kesalahan.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
    <div><h2 className="font-semibold">Buat draft proposal</h2><p className="text-xs text-muted-foreground">Draft belum dapat disetujui customer sampai disetujui internal dan dikirim resmi.</p></div>
    <label className="block space-y-1 text-sm"><span>Judul proposal *</span><input name="title" required minLength={4} defaultValue="Proposal digitalisasi proses bisnis" className="w-full rounded-md border bg-background px-3 py-2" /></label>
    <label className="block space-y-1 text-sm"><span>Problem statement *</span><textarea name="problemStatement" required minLength={8} rows={3} defaultValue={defaultProblem} className="w-full rounded-md border bg-background px-3 py-2" /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1 text-sm"><span>Scope termasuk (satu per baris)</span><textarea name="scopeIn" rows={3} required className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Scope tidak termasuk</span><textarea name="scopeOut" rows={3} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Deliverables (satu per baris) *</span><textarea name="deliverables" rows={3} required className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Timeline ringkas *</span><textarea name="timelineSummary" rows={3} required className="w-full rounded-md border bg-background px-3 py-2" placeholder="Contoh: discovery, implementasi, uji, serah terima" /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1 text-sm"><span>Estimasi durasi (hari) *</span><input name="estimatedDurationDays" type="number" min="1" max="3650" defaultValue="30" required className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Total biaya (Rp) *</span><input name="totalAmount" type="number" min="1" step="1000" required className="w-full rounded-md border bg-background px-3 py-2" /></label>
    </div>
    <fieldset className="space-y-3 rounded-lg border p-4"><legend className="px-1 text-sm font-semibold">Milestone awal</legend>
      <label className="block space-y-1 text-sm"><span>Judul milestone *</span><input name="milestoneTitle" required defaultValue="Analisis dan rancangan" className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Deskripsi *</span><textarea name="milestoneDescription" required defaultValue="Pemetaan kebutuhan, validasi alur, dan rancangan solusi." rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Kriteria penerimaan (satu per baris)</span><textarea name="milestoneCriteria" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Label termin *</span><input name="paymentLabel" required defaultValue="Termin pertama / pembayaran sesuai kesepakatan" className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <p className="text-xs text-muted-foreground">Form ringkas ini membuat satu milestone dan satu termin sebesar total proposal. Revisi rincian dapat diajukan melalui workflow versi berikutnya.</p>
    </fieldset>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1 text-sm"><span>Asumsi</span><textarea name="assumptions" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Ketergantungan dari pelanggan</span><textarea name="customerDependencies" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Kriteria penerimaan akhir</span><textarea name="acceptanceCriteria" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
      <label className="block space-y-1 text-sm"><span>Exclusions / pengecualian</span><textarea name="exclusions" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
    </div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <button disabled={busy} type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Menyimpan..." : "Simpan draft proposal"}</button>
  </form>;
}
