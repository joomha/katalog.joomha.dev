"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProposalDecisionControls({ proposalId, revisionId }: { proposalId: string; revisionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  async function decide(decision: "ACCEPT" | "REJECT") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/business-services/proposals/${proposalId}/revisions/${revisionId}/decision`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, feedback }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Keputusan belum tersimpan.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Terjadi kesalahan.");
    } finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3">
    <label className="block space-y-1 text-sm"><span>Catatan untuk tim (opsional)</span><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2" /></label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => void decide("ACCEPT")} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Terima proposal</button>
      <button disabled={busy} onClick={() => void decide("REJECT")} className="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50">Tolak proposal</button>
    </div>
  </div>;
}
