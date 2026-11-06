import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/identity/guards";
import { listCustomerBusinessProjects, listCustomerBusinessRequests } from "@/modules/business-services";
import { ProposalDecisionControls } from "@/modules/business-services/components/proposal-decision-controls";

export const metadata: Metadata = { title: "Permintaan & Proyek Saya" };

const money = (amount: unknown, currency: string) => new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount));

export default async function CustomerProjectsPage() {
  await requireUser();
  const [requests, projects] = await Promise.all([listCustomerBusinessRequests(), listCustomerBusinessProjects()]);
  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Akun pelanggan</p><h1 className="mt-1 text-2xl font-bold">Permintaan & Proyek Saya</h1><p className="mt-1 text-sm text-muted-foreground">Pantau permintaan, penawaran resmi, milestone, dan serah terima proyek.</p></div>
      <Link href="/jasa-digitalisasi/ajukan" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Ajukan kebutuhan baru</Link>
    </header>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Proyek berjalan</h2>
      {projects.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Belum ada proyek yang terbentuk. Proyek akan muncul di sini setelah proposal resmi disetujui.</div> :
        <div className="grid gap-4 md:grid-cols-2">{projects.map((project) => <article key={project.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{project.projectCode}</p><span className="rounded-full bg-muted px-2 py-1 text-xs">{project.status.replace(/_/g, " ")}</span></div>
          <h3 className="mt-2 font-semibold">{project.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
          <p className="mt-3 text-sm font-semibold">{money(project.totalAmount, project.currency)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{project.milestones.length} milestone · {project.deliverables.length} deliverable</p>
          <Link href={`/akun/proyek/${project.id}`} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Lihat progres proyek →</Link>
        </article>)}</div>}
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Riwayat permintaan</h2>
      {requests.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Belum ada permintaan jasa digitalisasi.</div> :
        <div className="space-y-3">{requests.map((request) => <article key={request.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Permintaan {request.id}</p><span className="rounded-full bg-muted px-2 py-1 text-xs">{request.status.replace(/_/g, " ")}</span></div>
          <h3 className="mt-2 font-semibold">{request.serviceTitleSnapshot ?? "Kebutuhan digitalisasi khusus"}</h3><p className="mt-1 text-sm text-muted-foreground">{request.mainProblem}</p>
          {request.proposals.map((proposal) => <div key={proposal.id} className="mt-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{proposal.proposalCode}</p><span className="text-xs text-muted-foreground">{proposal.status}</span></div>
            {proposal.revisions.map((revision) => <div key={revision.id} className="mt-2">
              <p className="text-sm font-medium">{revision.title} · v{revision.version}</p>
              <p className="text-sm text-muted-foreground">{money(revision.totalAmount, revision.currency)} · {revision.timelineSummary}</p>
              {revision.status === "SENT" && <ProposalDecisionControls proposalId={proposal.id} revisionId={revision.id} />}
              {revision.status === "ACCEPTED" && <p className="mt-2 text-sm text-emerald-700">Proposal disetujui. Proyek telah dibuat.</p>}
              {revision.status === "REJECTED" && <p className="mt-2 text-sm text-muted-foreground">Proposal ditolak. Catatan: {revision.customerFeedback ?? "—"}</p>}
            </div>)}
          </div>)}
        </article>)}</div>}
    </section>
  </div>;
}
