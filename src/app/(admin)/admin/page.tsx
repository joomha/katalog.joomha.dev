import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminAccess, getCurrentUserAccess } from "@/modules/identity/guards";
import { prisma } from "@/lib/db/prisma";
export const metadata:Metadata={title:"Dasbor Admin"};
const DOMAIN_STATUS=[
 {title:"Pesanan & pembayaran",detail:"Ringkasan order dan pending payment menunggu integrasi modul commerce.",href:"/admin/pesanan"},
 {title:"Konsultasi & les privat",detail:"Permintaan review dan penawaran menunggu integrasi modul konsultasi/tutoring.",href:"/admin/les-privat"},
 {title:"Jasa digitalisasi",detail:"Proposal dan proyek aktif menunggu integrasi modul business services.",href:"/admin/jasa"},
 {title:"Pembelajaran",detail:"Enrollment, murid, dan kursus menunggu integrasi modul LMS.",href:"/admin/pembelajaran"}
];
export default async function AdminHomePage(){
 const admin=await requireAdminAccess(),access=await getCurrentUserAccess();
 const [unreadNotifications,activeFiles,auditCount,recentNotifications]=await Promise.all([
  prisma.notification.count({where:{userId:admin.id,readAt:null}}),
  prisma.storedFile.count({where:{status:"ACTIVE"}}),
  prisma.auditLog.count(),
  prisma.notification.findMany({where:{userId:admin.id},orderBy:{createdAt:"desc"},take:5})
 ]);
 return <div className="space-y-8">
  <section><h1 className="text-xl font-semibold tracking-tight">Ringkasan Admin</h1><p className="mt-1 text-sm text-muted-foreground">Selamat datang, {admin.name}. Ringkasan platform berdasarkan data yang tersedia.</p></section>
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {([["Notifikasi belum dibaca",unreadNotifications,"/admin/platform/notifikasi"],["File tersimpan",activeFiles,"/admin/platform"],["Catatan audit",auditCount,"/admin/platform"],["Permission aktif",admin.roles.includes("SUPERADMIN")?"Semua":access?.permissions.length??0,"/admin/platform"]] as const).map(([label,value,href])=><Link key={label} href={href} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></Link>)}
  </section>
  <section><div className="flex items-center justify-between"><h2 className="font-semibold">Operasional domain</h2><span className="text-xs text-muted-foreground">Status integrasi</span></div><div className="mt-3 grid gap-4 sm:grid-cols-2">{DOMAIN_STATUS.map(item=><div key={item.title} className="rounded-lg border border-dashed bg-card p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{item.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Menunggu integrasi</span></div><p className="mt-2 text-xs text-muted-foreground">{item.detail}</p></div>)}</div></section>
  <section className="rounded-lg border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Notifikasi terbaru</h2><Link href="/admin/platform/notifikasi" className="text-sm text-primary hover:underline">Lihat semua</Link></div>{recentNotifications.length===0?<p className="mt-4 text-sm text-muted-foreground">Belum ada notifikasi untuk akun admin ini.</p>:<ul className="mt-3 divide-y">{recentNotifications.map(item=><li key={item.id} className="py-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.body}</p></li>)}</ul>}</section>
 </div>;
}
