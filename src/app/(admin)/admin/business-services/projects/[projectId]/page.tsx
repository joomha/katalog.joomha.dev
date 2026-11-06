import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { getBusinessProjectForAdmin } from "@/modules/business-services";
import { AdminProjectTools } from "@/modules/business-services/components/admin-project-tools";
import { AdminMilestoneControls } from "@/modules/business-services/components/admin-milestone-controls";

export const metadata: Metadata = { title: "Kelola Proyek Digitalisasi" };

export default async function AdminBusinessProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requirePermission(PERMISSIONS.BUSINESS_VIEW);
  const { projectId } = await params;
  const project = await getBusinessProjectForAdmin(projectId);
  return <div className="space-y-6">
    <Link href="/admin/business-services" className="text-sm text-primary hover:underline">← Kembali ke jasa digitalisasi</Link>
    <header className="rounded-xl border bg-card p-5"><p className="text-xs text-muted-foreground">{project.projectCode}</p><div className="mt-1 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{project.title}</h1><span className="rounded-full bg-muted px-2 py-1 text-xs">{project.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{project.summary}</p><p className="mt-3 text-sm">Pelanggan: {project.request.contactName} · {project.request.contactEmail}</p><p className="mt-1 text-xs text-muted-foreground">Nilai snapshot: Rp {Number(project.totalAmount).toLocaleString("id-ID")} {project.currency}</p></header>
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Milestone proyek</h2><div className="mt-4 space-y-4">{project.milestones.map((item) => <article key={item.id} className="border-l-2 pl-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.sequence}. {item.title}</p><span className="text-xs text-muted-foreground">{item.status} · {item.progress}%</span></div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><AdminMilestoneControls projectId={project.id} milestoneId={item.id} status={item.status} progress={item.progress} /></article>)}</div></section>
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Deliverables</h2><div className="mt-3 space-y-3">{project.deliverables.map((item) => <article key={item.id} className="rounded-lg border p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.title}</p><span className="text-xs text-muted-foreground">{item.reviewStatus}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p>{item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Buka tautan</a>}</article>)}{project.deliverables.length === 0 && <p className="text-sm text-muted-foreground">Belum ada deliverable.</p>}</div></section>
    <AdminProjectTools projectId={project.id} />
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Riwayat update (customer & internal)</h2><div className="mt-3 space-y-3">{project.updates.map((item) => <article key={item.id} className="border-l-2 pl-3"><div className="flex gap-2 text-xs text-muted-foreground"><span>{item.visibility}</span><span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(item.createdAt)}</span></div><p className="mt-1 text-sm">{item.message}</p></article>)}</div></section>
  </div>;
}
