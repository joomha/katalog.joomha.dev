"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HandoverConfirmation({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (!window.confirm("Konfirmasikan bahwa proses serah terima proyek telah selesai?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/business-services/projects/${projectId}/handover/confirm`, { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Konfirmasi belum berhasil.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-2"><p className="text-xs text-emerald-900">Setelah memastikan hasil pekerjaan telah diterima, Anda dapat mengonfirmasi penyelesaian proyek.</p>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} onClick={() => void confirm()} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Memproses..." : "Konfirmasi serah terima"}</button></div>;
}
