"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeliverableReviewControls({ deliverableId }: { deliverableId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(decision: "ACCEPTED" | "CHANGES_REQUESTED" | "REJECTED") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/business-services/deliverables/${deliverableId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, feedback }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Review belum tersimpan.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-2">
    <label className="block space-y-1 text-sm"><span>Catatan review (opsional)</span><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void submit("ACCEPTED")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">Terima hasil</button><button disabled={busy} onClick={() => void submit("CHANGES_REQUESTED")} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">Minta revisi</button><button disabled={busy} onClick={() => void submit("REJECTED")} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">Tolak</button></div>
  </div>;
}
