"use client";
import { useEffect, useState } from "react";
const CATEGORIES=[
 ["TRANSACTIONAL","Pesanan dan pembayaran"],
 ["LEARNING","Kelas dan sertifikat"],
 ["TUTORING","Les privat"],
 ["BUSINESS","Jasa digitalisasi"],
 ["CONSULTATION","Konsultasi"],
 ["SYSTEM","Informasi sistem"]
] as const;
type Category=typeof CATEGORIES[number][0];
type Preference={category:Category;inAppEnabled:boolean;emailEnabled:boolean};
export function NotificationPreferences(){
 const [values,setValues]=useState<Record<Category,Preference>>(()=>Object.fromEntries(CATEGORIES.map(([category])=>[category,{category,inAppEnabled:true,emailEnabled:true}])) as Record<Category,Preference>);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState<Category|null>(null),[message,setMessage]=useState("");
 useEffect(()=>{let active=true;fetch("/api/notifications/preferences").then(async response=>{if(!response.ok)throw new Error();const data=await response.json() as {items:Preference[]};if(active)setValues(current=>({...current,...Object.fromEntries(data.items.map(item=>[item.category,item]))}));}).catch(()=>{if(active)setMessage("Preferensi belum dapat dimuat.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 async function update(category:Category,key:"inAppEnabled"|"emailEnabled",value:boolean){
  const previous=values[category];setValues(current=>({...current,[category]:{...current[category],[key]:value}}));setBusy(category);setMessage("");
  try{const response=await fetch("/api/notifications/preferences",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({category,[key]:value})});if(!response.ok)throw new Error();}
  catch{setValues(current=>({...current,[category]:previous}));setMessage("Perubahan gagal disimpan. Silakan coba lagi.");}
  finally{setBusy(null);}
 }
 return <section className="space-y-3 rounded-lg border bg-card p-5">
  <div><h2 className="font-semibold">Preferensi notifikasi</h2><p className="mt-1 text-xs text-muted-foreground">Matikan kategori non-esensial yang tidak ingin diterima. Notifikasi transaksi penting selalu aktif.</p></div>
  {CATEGORIES.map(([category,label])=><div key={category} className="flex flex-wrap items-center justify-between gap-4 border-t pt-3"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{category==="TRANSACTIONAL"?"Wajib aktif":category}</p></div><div className="flex gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={values[category].inAppEnabled} disabled={loading||busy===category||category==="TRANSACTIONAL"} onChange={event=>update(category,"inAppEnabled",event.target.checked)}/> Dalam aplikasi</label><label className="flex items-center gap-2"><input type="checkbox" checked={values[category].emailEnabled} disabled={loading||busy===category||category==="TRANSACTIONAL"} onChange={event=>update(category,"emailEnabled",event.target.checked)}/> Email</label></div></div>)}
  <p role="status" className="text-xs text-muted-foreground">{loading?"Memuat preferensi…":message}</p>
 </section>;
}
