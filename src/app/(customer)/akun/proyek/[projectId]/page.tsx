import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/identity/guards";
import { getCustomerBusinessProjectProgress } from "@/modules/business-services";
import { ProposalDecisionControls } from "@/modules/business-services/components/proposal-decision-controls";

export const metadata: Metadata = { title: "Detail Proyek" };
const money = (amount: number, currency: string) => new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export default async function CustomerProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireUser();
  const { projectId } = await params;
  const project = await getCustomerBusinessProjectProgress(projectId);
  return <div className="space-y-6">
    <Link href="/akun/proyek" className="text-sm text-primary hover:underline">← Kembali ke proyek</Link>
    <header className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{project.projectCode}</p><span className="rounded-full bg-muted px-2 py-1 text-xs">{project.status.replace(/_/g, " ")}</span></div>
      <h1 className="mt-2 text-2xl font-bold">{project.title}</h1><p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
      <p className="mt-4 text-lg font-bold">{money(project.totalAmount, project.currency)}</p>
      <p className="text-xs text-muted-foreground">Target penyelesaian: {project.targetCompletionAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(project.targetCompletionAt)) : "Belum ditetapkan"}</p>
    </header>
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Milestone</h2>
      {project.milestones.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Belum ada milestone.</p> : <ol className="mt-4 space-y-4">{project.milestones.map((item) => <li key={item.id} className="border-l-2 pl-4">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.sequence}. {item.title}</p><span className="text-xs text-muted-foreground">{item.status}</span></div>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${item.progress}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{item.progress}%</p>
        {item.status === "REVIEW" && <p className="mt-2 text-sm text-muted-foreground">Milestone ini sedang menunggu review/persetujuan Anda. Hubungi tim melalui kanal komunikasi yang telah disepakati.</p>}
      </li>)}</ol>}
    </section>
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Deliverables</h2>
      {project.deliverables.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Belum ada hasil pekerjaan yang dibagikan.</p> : <div className="mt-3 space-y-3">{project.deliverables.map((item) => <article key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.title} · v{item.version}</p><span className="text-xs text-muted-foreground">{item.reviewStatus}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p>{item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline">Buka deliverable</a>}{item.feedback && <p className="mt-2 text-xs text-muted-foreground">Catatan: {item.feedback}</p>}</article>)}</div>}
    </section>
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Termin pembayaran</h2><div className="mt-3 divide-y">{project.paymentTerms.map((term) => <div key={term.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><p className="font-medium">{term.sequence}. {term.label}</p>{term.dueAt && <p className="text-xs text-muted-foreground">Target: {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(term.dueAt))}</p>}</div><div className="text-right"><p className="font-semibold">{money(term.amount, term.currency)}</p><p className="text-xs text-muted-foreground">{term.status}</p></div></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Pembuatan invoice dan verifikasi pembayaran dikelola melalui sistem pembayaran Joomha.</p>
    </section>
    {project.updates.length > 0 && <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Pembaruan progres</h2><ol className="mt-3 space-y-3">{project.updates.map((update) => <li key={update.id} className="border-l-2 pl-3"><p className="text-sm">{update.message}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(update.createdAt))}{update.progress !== null ? ` · ${update.progress}%` : ""}</p></li>)}</ol></section>}
    {project.status === "REVIEW" && project.handoverSummary && <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-5"><h2 className="font-semibold text-emerald-950">Serah terima menunggu konfirmasi</h2><p className="mt-2 text-sm text-emerald-900">{project.handoverSummary}</p><p className="mt-2 text-xs text-emerald-800">Konfirmasi penyelesaian dilakukan bersama tim Joomha setelah seluruh deliverable ditinjau.</p></section>}
  </div>;
}
