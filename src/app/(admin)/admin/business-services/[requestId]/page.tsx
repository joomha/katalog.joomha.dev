import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { getBusinessRequestForAdmin } from "@/modules/business-services";
import { ProposalDraftForm } from "@/modules/business-services/components/proposal-draft-form";
import { ProposalAdminActions } from "@/modules/business-services/components/proposal-admin-actions";

export const metadata: Metadata = { title: "Detail Permintaan Proyek" };

export default async function AdminBusinessRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  await requirePermission(PERMISSIONS.BUSINESS_VIEW);
  const { requestId } = await params;
  const request = await getBusinessRequestForAdmin(requestId);
  const canManage = await (async () => { try { await requirePermission(PERMISSIONS.BUSINESS_MANAGE); return true; } catch { return false; } })();
  return <div className="space-y-6">
    <Link href="/admin/business-services" className="text-sm text-primary hover:underline">← Kembali ke daftar permintaan</Link>
    <header><p className="text-xs text-muted-foreground">{request.id} · {request.source}</p><h1 className="mt-1 text-2xl font-bold">{request.serviceTitleSnapshot ?? "Kebutuhan digitalisasi khusus"}</h1><p className="mt-1 text-sm text-muted-foreground">{request.status.replace(/_/g, " ")}</p></header>
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Kontak pelanggan</h2><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-muted-foreground">Nama</dt><dd>{request.contactName}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd>{request.contactEmail}</dd></div><div><dt className="text-muted-foreground">Telepon</dt><dd>{request.contactPhone ?? "—"}</dd></div><div><dt className="text-muted-foreground">Organisasi</dt><dd>{request.businessName ?? "—"} · {request.businessType ?? "—"}</dd></div><div><dt className="text-muted-foreground">Skala</dt><dd>{request.organizationSize ?? "—"}</dd></div><div><dt className="text-muted-foreground">Persetujuan kontak</dt><dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(request.contactConsentAt)}</dd></div></dl></article>
      <article className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Kebutuhan</h2><div className="mt-3 space-y-3 text-sm"><div><p className="text-muted-foreground">Proses saat ini</p><p className="whitespace-pre-wrap">{request.currentProcess ?? "—"}</p></div><div><p className="text-muted-foreground">Masalah utama</p><p className="whitespace-pre-wrap">{request.mainProblem}</p></div><div><p className="text-muted-foreground">Hasil yang diharapkan</p><p className="whitespace-pre-wrap">{request.desiredOutcome}</p></div><div><p className="text-muted-foreground">Volume/tools/integrasi</p><p>{request.workVolume ?? "—"} · {request.currentTools.join(", ") || "—"} · {request.integrationNeeds.join(", ") || "—"}</p></div><div><p className="text-muted-foreground">Anggaran</p><p>{request.budgetMin?.toString() ?? "—"} – {request.budgetMax?.toString() ?? "—"} {request.budgetNote ? `· ${request.budgetNote}` : ""}</p></div></div></article>
    </section>
    {request.internalNotes && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4"><h2 className="font-semibold text-amber-950">Catatan internal (khusus tim)</h2><p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{request.internalNotes}</p></section>}
    <section className="space-y-4"><h2 className="text-lg font-semibold">Proposal dan riwayat revisi</h2>
      {request.proposals.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada proposal.</p> : request.proposals.map((proposal) => <article key={proposal.id} className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{proposal.proposalCode}</h3><p className="text-xs text-muted-foreground">Status: {proposal.status} · Versi aktif: {proposal.currentVersion}</p></div></div>
        <div className="mt-4 space-y-3">{proposal.revisions.map((revision) => <div key={revision.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">v{revision.version} · {revision.title}</p><span className="text-xs text-muted-foreground">{revision.status}</span></div>
          <p className="mt-2 text-sm text-muted-foreground">{revision.problemStatement}</p>
          <p className="mt-2 text-sm">Total: Rp {Number(revision.totalAmount).toLocaleString("id-ID")} · {revision.timelineSummary}</p>
          <p className="mt-1 text-xs text-muted-foreground">Berlaku sampai {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(revision.validUntil)}</p>
          {canManage && revision.version === proposal.currentVersion && <ProposalAdminActions proposalId={proposal.id} revisionId={revision.id} status={revision.status} />}
        </div>)}</div>
      </article>)}
    </section>
    {canManage && request.status !== "CONVERTED_TO_PROJECT" && !["CANCELLED", "CLOSED"].includes(request.status) && <ProposalDraftForm requestId={request.id} defaultProblem={request.mainProblem} />}
    {request.projects.map((project) => <section key={project.id} className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Proyek terbentuk</h2><p className="mt-1 text-sm">{project.projectCode} · {project.title} · {project.status}</p><Link href={`/admin/business-services/projects/${project.id}`} className="mt-2 inline-block text-sm text-primary underline">Kelola proyek</Link></section>)}
  </div>;
}
