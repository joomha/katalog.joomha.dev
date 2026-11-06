import type { Metadata } from "next";
import { listNotificationsForUser } from "@/modules/platform";
import { NotificationActions } from "@/modules/platform/notification-actions";
import { NotificationPreferences } from "@/modules/platform/notification-preferences";
import Link from "next/link";
import { requireUser } from "@/modules/identity/guards";
export const metadata:Metadata={title:"Notifikasi Saya"};
export default async function MyNotificationsPage(){
 await requireUser();
 const {items,unreadCount}=await listNotificationsForUser({limit:50});
 return <div className="space-y-6">
  <section className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-semibold">Notifikasi Saya</h1><p className="mt-1 text-sm text-muted-foreground">{unreadCount} notifikasi belum dibaca.</p></div><NotificationActions unreadCount={unreadCount}/></section>
  {items.length===0?<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada notifikasi. Kami akan menampilkan pembaruan pesanan, kelas, dan konsultasi di sini.</div>:<ul className="divide-y rounded-lg border bg-card">{items.map(item=><li key={item.id} className="flex flex-wrap items-start justify-between gap-4 p-4"><div className="min-w-0"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(item.createdAt)}</p>{item.resourceUrl?<Link href={item.resourceUrl} className="mt-2 inline-block text-sm text-primary hover:underline">Lihat detail</Link>:null}</div><div className="flex items-center gap-2">{!item.readAt?<span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Baru</span>:null}{!item.readAt?<NotificationActions notificationId={item.id}/>:null}</div></li>)}</ul>}
  <NotificationPreferences/>
 </div>;
}
