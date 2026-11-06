"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminMilestoneControls({ projectId, milestoneId, status, progress }: { projectId: string; milestoneId: string; status: string; progress: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(nextStatus: "IN_PROGRESS" | "REVIEW" | "BLOCKED" | "COMPLETED") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/business-services/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, progress: nextStatus === "COMPLETED" ? 100 : progress }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Status milestone belum berubah.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  return <div className="mt-2 space-y-2"><div className="flex flex-wrap gap-2">
    {status === "PENDING" && <button disabled={busy} onClick={() => void update("IN_PROGRESS")} className="rounded border px-2 py-1 text-xs">Mulai</button>}
    {status === "IN_PROGRESS" && <button disabled={busy} onClick={() => void update("REVIEW")} className="rounded border px-2 py-1 text-xs">Kirim untuk review</button>}
    {status !== "COMPLETED" && status !== "CANCELLED" && <button disabled={busy} onClick={() => void update("BLOCKED")} className="rounded border px-2 py-1 text-xs">Tandai terhambat</button>}
    {status !== "COMPLETED" && <button disabled={busy} onClick={() => void update("COMPLETED")} className="rounded border px-2 py-1 text-xs">Tandai selesai</button>}
  </div>{error && <p role="alert" className="text-xs text-red-600">{error}</p>}</div>;
}
