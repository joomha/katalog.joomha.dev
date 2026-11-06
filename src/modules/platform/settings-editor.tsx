"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
type Values={brandDisplayName:string;supportContact:string;timezone:string;maintenanceBanner:string;maxUploadBytes:number};
export function SettingsEditor({initial,editable}:{initial:Values;editable:boolean}){
 const [values,setValues]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const entries=Object.entries(values) as [keyof Values,Values[keyof Values]][];
   for(const [key,value] of entries){
    const response=await fetch("/api/admin/platform/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,value})});
    if(!response.ok)throw new Error("Simpan pengaturan gagal pada "+key);
   }
   setMessage("Pengaturan berhasil disimpan.");
  }catch(error){setMessage(error instanceof Error?error.message:"Terjadi kesalahan.");}
  finally{setBusy(false);}
 }
 const field=(key:keyof Values,label:string,type="text")=><label className="block space-y-1"><span className="text-sm font-medium">{label}</span><input type={type} disabled={!editable||busy} value={String(values[key])} onChange={event=>setValues(current=>({...current,[key]:type==="number"?Number(event.target.value):event.target.value}))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"/></label>;
 return <form onSubmit={save} className="space-y-4 rounded-lg border bg-card p-5">
  <div><h2 className="font-semibold">Pengaturan non-secret</h2><p className="mt-1 text-xs text-muted-foreground">Secret dan API key tidak dapat disimpan melalui menu ini.</p></div>
  <div className="grid gap-4 sm:grid-cols-2">{field("brandDisplayName","Nama brand")}{field("supportContact","Kontak dukungan")}{field("timezone","Zona waktu")}{field("maxUploadBytes","Batas upload (byte)","number")}</div>
  {field("maintenanceBanner","Banner pemeliharaan")}
  <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!editable||busy}>{busy?"Menyimpan…":"Simpan pengaturan"}</Button><span role="status" className="text-xs text-muted-foreground">{message||(!editable?"Hanya superadmin/role berizin yang dapat mengubah pengaturan.":"")}</span></div>
 </form>;
}
