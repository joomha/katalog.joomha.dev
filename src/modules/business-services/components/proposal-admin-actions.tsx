"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProposalAdminActions({ proposalId, revisionId, status }: { proposalId: string; revisionId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: "approve" | "send") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/business-services/proposals/${proposalId}/revisions/${revisionId}/${action}`, { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Tindakan belum berhasil.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-2">
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && <button disabled={busy} onClick={() => void run("approve")} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50">Setujui internal</button>}
      {status === "APPROVED" && <button disabled={busy} onClick={() => void run("send")} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Kirim penawaran resmi</button>}
    </div>
  </div>;
}