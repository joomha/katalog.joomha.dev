import type { Metadata } from "next";
import { requirePermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { listNotificationsForUser } from "@/modules/platform";
import { NotificationActions } from "@/modules/platform/notification-actions";
export const metadata:Metadata={title:"Notifikasi Platform"};
export default async function PlatformNotificationsPage(){
 await requirePermission(PERMISSIONS.PLATFORM_VIEW);
 const {items,unreadCount}=await listNotificationsForUser({limit:30});
 return <div className="space-y-6">
  <section className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-semibold">Notifikasi</h1><p className="mt-1 text-sm text-muted-foreground">{unreadCount} belum dibaca · daftar notifikasi akun admin yang sedang masuk.</p></div><NotificationActions unreadCount={unreadCount}/></section>
  {items.length===0?<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada notifikasi untuk akun ini.</div>:<ul className="divide-y rounded-lg border bg-card">{items.map(item=><li key={item.id} className="flex flex-wrap items-start justify-between gap-4 p-4"><div><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{item.category} · {new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(item.createdAt)}</p></div><div className="flex items-center gap-2">{!item.readAt?<span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Baru</span>:<span className="text-xs text-muted-foreground">Dibaca</span>}{!item.readAt?<NotificationActions notificationId={item.id}/>:null}</div></li>)}</ul>}
 </div>;
}
