import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { getAdminSystemSettings, listAuditLogs } from "@/modules/platform";
export const metadata:Metadata={title:"Platform & Audit"};
export default async function PlatformAdminPage(){
 await requirePermission(PERMISSIONS.PLATFORM_VIEW);
 const [settings,auditLogs]=await Promise.all([getAdminSystemSettings(),listAuditLogs({limit:10})]);
 return <div className="space-y-8">
  <section><h1 className="text-xl font-semibold">Platform & Audit</h1><p className="mt-1 text-sm text-muted-foreground">Konfigurasi non-secret dan jejak aktivitas administratif.</p></section>
  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
   {([["Nama brand",settings.brandDisplayName],["Mata uang",settings.currency],["Zona waktu",settings.timezone],["Batas upload",(Number(settings.maxUploadBytes)/1024/1024).toFixed(0)+" MB"],["Kontak dukungan",settings.supportContact||"Belum diatur"],["Banner pemeliharaan",settings.maintenanceBanner||"Tidak aktif"]] as const).map(([label,value])=><div key={label} className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-medium">{String(value)}</p></div>)}
  </section>
  <section className="rounded-lg border bg-card p-5">
   <div className="flex items-center justify-between"><h2 className="font-semibold">Audit terbaru</h2><span className="text-xs text-muted-foreground">{auditLogs.length} catatan</span></div>
   {auditLogs.length===0?<p className="mt-4 text-sm text-muted-foreground">Belum ada aktivitas audit yang tercatat.</p>:<ul className="mt-4 divide-y">{auditLogs.map(log=><li key={log.id} className="py-3"><p className="text-sm font-medium">{log.action}</p><p className="mt-1 text-xs text-muted-foreground">{log.targetType}{log.targetId?" · "+log.targetId:""} · {new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(log.createdAt)}</p></li>)}</ul>}
  </section>
  <p className="text-sm"><Link href="/admin" className="text-primary hover:underline">Kembali ke ringkasan admin</Link></p>
 </div>;
}
