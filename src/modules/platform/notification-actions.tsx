"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function NotificationActions({notificationId,unreadCount}:{notificationId?:string;unreadCount?:number}){
 const router=useRouter(),[busy,startTransition]=useTransition(),[message,setMessage]=useState("");
 async function run(url:string,method:string){
  setMessage("");
  try{const response=await fetch(url,{method});if(!response.ok)throw new Error("Permintaan gagal");setMessage("Status notifikasi diperbarui.");startTransition(()=>router.refresh());}
  catch{setMessage("Tidak dapat memperbarui notifikasi. Coba lagi.");}
 }
 return <div className="flex flex-wrap items-center gap-2">
  {notificationId?<Button size="sm" variant="outline" disabled={busy} onClick={()=>run("/api/notifications/"+notificationId+"/read","PATCH")}>Tandai dibaca</Button>:<Button size="sm" variant="outline" disabled={busy||!unreadCount} onClick={()=>run("/api/notifications/read-all","POST")}>Tandai semua dibaca</Button>}
  {message?<span role="status" className="text-xs text-muted-foreground">{message}</span>:null}
 </div>;
}
