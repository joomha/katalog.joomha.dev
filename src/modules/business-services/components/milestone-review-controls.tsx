"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function MilestoneReviewControls({ projectId, milestoneId }: { projectId: string; milestoneId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(status: "ACCEPTED" | "CHANGES_REQUESTED") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/business-services/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, customerFeedback: feedback }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Tanggapan belum tersimpan.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-2">
    <label className="block space-y-1 text-sm"><span>Catatan review (opsional)</span><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void submit("ACCEPTED")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">Terima milestone</button><button disabled={busy} onClick={() => void submit("CHANGES_REQUESTED")} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">Minta perubahan</button></div>
  </div>;
}
