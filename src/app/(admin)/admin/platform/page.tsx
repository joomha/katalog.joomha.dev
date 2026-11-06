import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission, getCurrentUserAccess } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { getAdminSystemSettings, listAuditLogs } from "@/modules/platform";
import { SettingsEditor } from "@/modules/platform/settings-editor";
export const metadata:Metadata={title:"Platform & Audit"};
export default async function PlatformAdminPage(){
 const [admin,settings,auditLogs]=await Promise.all([requirePermission(PERMISSIONS.PLATFORM_VIEW),getAdminSystemSettings(),listAuditLogs({limit:10})]);
 const access=await getCurrentUserAccess(),editable=admin.roles.includes("SUPERADMIN")||Boolean(access?.permissions.includes(PERMISSIONS.PLATFORM_MANAGE));
 return <div className="space-y-8">
  <section><h1 className="text-xl font-semibold">Platform & Audit</h1><p className="mt-1 text-sm text-muted-foreground">Konfigurasi non-secret dan jejak aktivitas administratif.</p></section>
  <SettingsEditor initial={{brandDisplayName:String(settings.brandDisplayName),supportContact:String(settings.supportContact),timezone:String(settings.timezone),maintenanceBanner:String(settings.maintenanceBanner),maxUploadBytes:Number(settings.maxUploadBytes)}} editable={editable}/>
  <section className="rounded-lg border bg-card p-5">
   <div className="flex items-center justify-between"><h2 className="font-semibold">Audit terbaru</h2><span className="text-xs text-muted-foreground">{auditLogs.length} catatan</span></div>
   {auditLogs.length===0?<p className="mt-4 text-sm text-muted-foreground">Belum ada aktivitas audit yang tercatat.</p>:<ul className="mt-4 divide-y">{auditLogs.map(log=><li key={log.id} className="py-3"><p className="text-sm font-medium">{log.action}</p><p className="mt-1 text-xs text-muted-foreground">{log.targetType}{log.targetId?" · "+log.targetId:""} · {new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(log.createdAt)}</p></li>)}</ul>}
  </section>
  <p className="text-sm"><Link href="/admin" className="text-primary hover:underline">Kembali ke ringkasan admin</Link></p>
 </div>;
}
