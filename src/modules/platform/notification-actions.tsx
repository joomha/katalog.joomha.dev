"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function NotificationActions({notificationId,unreadCount}:{notificationId?:string;unreadCount?:number}){
 const router=useRouter(),[pending,setPending]=useState(false),[message,setMessage]=useState("");
 async function run(url:string,method:string){
  setPending(true);setMessage("");
  try{const response=await fetch(url,{method});if(!response.ok)throw new Error("Permintaan gagal");setMessage("Status notifikasi diperbarui.");router.refresh();}
  catch{setMessage("Tidak dapat memperbarui notifikasi. Coba lagi.");}
  finally{setPending(false);}
 }
 return <div className="flex flex-wrap items-center gap-2">
  {notificationId?<Button size="sm" variant="outline" disabled={pending} onClick={()=>run("/api/notifications/"+notificationId+"/read","PATCH")}>Tandai dibaca</Button>:<Button size="sm" variant="outline" disabled={pending||!unreadCount} onClick={()=>run("/api/notifications/read-all","POST")}>Tandai semua dibaca</Button>}
  {message?<span role="status" className="text-xs text-muted-foreground">{message}</span>:null}
 </div>;
}
