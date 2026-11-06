"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ServiceOption { slug: string; title: string; }
interface Props { services: ServiceOption[]; defaultServiceSlug?: string; }

function splitLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "").split("\n").map((entry) => entry.trim()).filter(Boolean);
}

export function BusinessRequestForm({ services, defaultServiceSlug = "" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const budgetMinText = String(form.get("budgetMin") ?? "").trim();
    const budgetMaxText = String(form.get("budgetMax") ?? "").trim();
    const targetDateText = String(form.get("targetDate") ?? "").trim();
    const payload = {
      serviceSlug: String(form.get("serviceSlug") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      contactConsent: form.get("contactConsent") === "on",
      businessName: String(form.get("businessName") ?? ""),
      businessType: String(form.get("businessType") ?? ""),
      organizationSize: String(form.get("organizationSize") ?? ""),
      currentProcess: String(form.get("currentProcess") ?? ""),
      mainProblem: String(form.get("mainProblem") ?? ""),
      workVolume: String(form.get("workVolume") ?? ""),
      currentTools: splitLines(form.get("currentTools")),
      desiredOutcome: String(form.get("desiredOutcome") ?? ""),
      integrationNeeds: splitLines(form.get("integrationNeeds")),
      budgetMin: budgetMinText ? Number(budgetMinText) : undefined,
      budgetMax: budgetMaxText ? Number(budgetMaxText) : undefined,
      budgetNote: String(form.get("budgetNote") ?? ""),
      targetDate: targetDateText ? new Date(`${targetDateText}T00:00:00+07:00`).toISOString() : undefined,
      attachments: [],
    };
    try {
      const response = await fetch("/api/business-services/requests", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { data?: { id?: string; status?: string }; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Permintaan belum dapat disimpan.");
      setMessage(`Permintaan berhasil dicatat dengan nomor ${result.data?.id ?? "baru"}. Tim Joomha akan meninjau kebutuhan Anda.`);
      event.currentTarget.reset();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <div><h2 className="font-semibold">1. Kontak dan layanan</h2><p className="mt-1 text-sm text-muted-foreground">Anda boleh mengirim kebutuhan tanpa mengetahui solusi atau layanan yang tepat.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm"><span>Nama lengkap *</span><input name="contactName" required minLength={2} maxLength={120} className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm"><span>Email aktif *</span><input name="contactEmail" type="email" required className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm"><span>Nomor telepon / WhatsApp</span><input name="contactPhone" maxLength={40} className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm"><span>Layanan (opsional)</span><select name="serviceSlug" defaultValue={defaultServiceSlug} className="w-full rounded-md border bg-background px-3 py-2"><option value="">Belum tahu / kebutuhan khusus</option>{services.map((service) => <option key={service.slug} value={service.slug}>{service.title}</option>)}</select></label>
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="contactConsent" required className="mt-1" /><span>Saya menyetujui Joomha menghubungi saya dan menggunakan informasi ini untuk meninjau kebutuhan proyek. *</span></label>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <div><h2 className="font-semibold">2. Profil usaha atau organisasi</h2><p className="mt-1 text-sm text-muted-foreground">Bagian ini opsional dan dapat diisi sejauh yang Anda ketahui.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm sm:col-span-1"><span>Nama usaha/organisasi</span><input name="businessName" className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm sm:col-span-1"><span>Bidang usaha</span><input name="businessType" placeholder="Contoh: pendidikan, retail" className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm sm:col-span-1"><span>Skala organisasi</span><input name="organizationSize" placeholder="Opsional" className="w-full rounded-md border bg-background px-3 py-2" /></label>
        </div>
        <label className="block space-y-1 text-sm"><span>Bagaimana proses kerja saat ini?</span><textarea name="currentProcess" rows={3} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Jelaskan proses yang ingin diperbaiki." /></label>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">3. Kebutuhan dan tujuan</h2>
        <label className="block space-y-1 text-sm"><span>Masalah utama yang ingin diselesaikan *</span><textarea name="mainProblem" required minLength={8} rows={4} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Apa yang saat ini menghambat pekerjaan Anda?" /></label>
        <label className="block space-y-1 text-sm"><span>Volume/frekuensi pekerjaan</span><input name="workVolume" className="w-full rounded-md border bg-background px-3 py-2" placeholder="Contoh: sekitar 200 data setiap bulan" /></label>
        <label className="block space-y-1 text-sm"><span>Aplikasi atau tools yang digunakan</span><textarea name="currentTools" rows={2} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Satu aplikasi per baris." /></label>
        <label className="block space-y-1 text-sm"><span>Hasil yang diharapkan *</span><textarea name="desiredOutcome" required minLength={8} rows={3} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Gambarkan kondisi yang ingin dicapai." /></label>
        <label className="block space-y-1 text-sm"><span>Kebutuhan integrasi</span><textarea name="integrationNeeds" rows={2} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Sistem/aplikasi yang perlu terhubung, satu per baris." /></label>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">4. Anggaran dan target waktu (opsional)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm"><span>Anggaran minimum (Rp)</span><input name="budgetMin" type="number" min="0" step="1000" className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm"><span>Anggaran maksimum (Rp)</span><input name="budgetMax" type="number" min="0" step="1000" className="w-full rounded-md border bg-background px-3 py-2" /></label>
          <label className="space-y-1 text-sm"><span>Target waktu</span><input name="targetDate" type="date" className="w-full rounded-md border bg-background px-3 py-2" /></label>
        </div>
        <label className="block space-y-1 text-sm"><span>Catatan anggaran/kebutuhan lain</span><textarea name="budgetNote" rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
        <p className="text-xs text-muted-foreground">Lampiran file belum diaktifkan karena adapter penyimpanan terintegrasi pada tahap Agent 09. Hindari mengirim data rahasia melalui form ini.</p>
      </section>

      {error && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"><p>{message}</p><a href="/akun/proyek" className="mt-2 inline-block font-semibold underline">Lihat permintaan dan proyek di akun saya</a></div>}
      <button type="submit" disabled={busy} className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Mengirim..." : "Kirim Permintaan Proyek"}</button>
    </form>
  );
}
