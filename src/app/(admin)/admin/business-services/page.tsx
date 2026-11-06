import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { listBusinessRequestsForAdmin } from "@/modules/business-services";

export const metadata: Metadata = { title: "Jasa Digitalisasi & Proyek" };

export default async function AdminBusinessServicesPage() {
  await requirePermission(PERMISSIONS.BUSINESS_VIEW);
  const requests = await listBusinessRequestsForAdmin();
  const newCount = requests.filter((item) => item.status === "NEW" || item.status === "NEEDS_DISCOVERY").length;
  const proposalCount = requests.filter((item) => item.status === "PROPOSAL_DRAFT" || item.status === "PROPOSAL_SENT").length;
  return <div className="space-y-6">
    <header><p className="text-xs uppercase tracking-widest text-muted-foreground">Operasional</p><h1 className="mt-1 text-2xl font-bold">Jasa Digitalisasi & Proyek</h1><p className="mt-1 text-sm text-muted-foreground">Tinjau kebutuhan pelanggan, siapkan proposal, dan pantau proyek.</p></header>
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Total request terbaru</p><p className="mt-1 text-2xl font-bold">{requests.length}</p></div><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Perlu discovery</p><p className="mt-1 text-2xl font-bold">{newCount}</p></div><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Dalam proses proposal</p><p className="mt-1 text-2xl font-bold">{proposalCount}</p></div></div>
    <section className="overflow-hidden rounded-xl border bg-card"><div className="border-b p-4"><h2 className="font-semibold">Permintaan terbaru</h2></div>
      {requests.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Belum ada permintaan proyek.</p> : <div className="divide-y">{requests.map((item) => <Link key={item.id} href={`/admin/business-services/${item.id}`} className="flex flex-col gap-2 p-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-medium">{item.serviceTitleSnapshot ?? "Kebutuhan digitalisasi khusus"}</p><p className="mt-1 text-xs text-muted-foreground">{item.contactName} · {item.contactEmail}{item.businessName ? ` · ${item.businessName}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">{item.id}</p></div>
        <div className="flex items-center gap-3"><span className="rounded-full bg-muted px-2 py-1 text-xs">{item.status.replace(/_/g, " ")}</span><span className="text-xs text-muted-foreground">{item._count.proposals} proposal · {item._count.projects} proyek</span></div>
      </Link>)}</div>}
    </section>
  </div>;
}
