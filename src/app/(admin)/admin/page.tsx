import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminAccess, getCurrentUserAccess } from "@/modules/identity/guards";
import { getAdminOverview } from "@/modules/platform";
export const metadata:Metadata={title:"Dasbor Admin"};
const DOMAIN_METRICS=[
 ["Total order","Commerce"],
 ["Pembayaran tertunda","Commerce"],
 ["Konsultasi menunggu review","AI Consultant"],
 ["Quote les menunggu tindakan","Tutoring"],
 ["Proposal bisnis aktif","Business Services"],
 ["Proyek aktif","Business Services"],
 ["Enrollment / murid / kursus","LMS"]
] as const;
export default async function AdminHomePage(){
 const admin=await requireAdminAccess(),access=await getCurrentUserAccess(),overview=await getAdminOverview();
 const platformHref=overview.canViewPlatform?"/admin/platform":"/admin";
 const cards=[["Notifikasi belum dibaca",String(overview.unreadNotifications),"/akun/notifikasi"],["File tersimpan",overview.activeFiles===null?"—":String(overview.activeFiles),platformHref],["Catatan audit",overview.auditCount===null?"—":String(overview.auditCount),platformHref],["Permission aktif",admin.roles.includes("SUPERADMIN")?"Semua":String(access?.permissions.length??0),"/akun"]];
 return <div className="space-y-8">
  <section><h1 className="text-xl font-semibold tracking-tight">Ringkasan Admin</h1><p className="mt-1 text-sm text-muted-foreground">Selamat datang, {admin.name}. Ringkasan platform berdasarkan data yang tersedia.</p></section>
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,href])=><Link key={label} href={href} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></Link>)}</section>
  <section><div className="flex items-center justify-between"><h2 className="font-semibold">Ringkasan operasional</h2><span className="text-xs text-muted-foreground">Status integrasi domain</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{DOMAIN_METRICS.map(([label,owner])=><div key={label} className="rounded-lg border border-dashed bg-card p-4"><p className="text-sm font-medium">{label}</p><p className="mt-2 text-sm text-muted-foreground">Belum tersedia</p><p className="mt-1 text-xs text-muted-foreground">Menunggu integrasi {owner}</p></div>)}</div></section>
  <section className="rounded-lg border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Notifikasi terbaru</h2><Link href="/akun/notifikasi" className="text-sm text-primary hover:underline">Lihat semua</Link></div>{overview.recentNotifications.length===0?<p className="mt-4 text-sm text-muted-foreground">Belum ada notifikasi untuk akun admin ini.</p>:<ul className="mt-3 divide-y">{overview.recentNotifications.map(item=><li key={item.id} className="py-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.body}</p></li>)}</ul>}</section>
 </div>;
}
