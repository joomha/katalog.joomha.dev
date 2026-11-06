import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { writeAuditLog } from "./audit.service";
const SCHEMAS={
 brandDisplayName:z.string().trim().min(1).max(80),
 supportContact:z.string().trim().max(160),
 currency:z.literal("IDR"),
 timezone:z.string().trim().min(1).max(64),
 maxUploadBytes:z.number().int().min(1024).max(100*1024*1024),
 maintenanceBanner:z.string().trim().max(300)
} as const;
export type SystemSettingKey=keyof typeof SCHEMAS;
export interface PublicSystemSettings {brandDisplayName:string;supportContact:string;currency:"IDR";timezone:string;maintenanceBanner:string}
const DEFAULTS={brandDisplayName:"Joomha Education",supportContact:"",currency:"IDR" as const,timezone:"Asia/Jakarta",maintenanceBanner:"",maxUploadBytes:10*1024*1024};
const PUBLIC_KEYS:readonly SystemSettingKey[]=["brandDisplayName","supportContact","currency","timezone","maintenanceBanner"];
export async function getPublicSystemSettings():Promise<PublicSystemSettings>{
 const rows=await prisma.systemSetting.findMany({where:{key:{in:[...PUBLIC_KEYS]},isPublic:true}});
 const v:Record<string,unknown>={...DEFAULTS};for(const row of rows)v[row.key]=row.value;
 return {brandDisplayName:SCHEMAS.brandDisplayName.parse(v.brandDisplayName),supportContact:SCHEMAS.supportContact.parse(v.supportContact),currency:"IDR",timezone:SCHEMAS.timezone.parse(v.timezone),maintenanceBanner:SCHEMAS.maintenanceBanner.parse(v.maintenanceBanner)};
}
export async function getAdminSystemSettings(){
 await assertPermission(PERMISSIONS.PLATFORM_VIEW);
 const rows=await prisma.systemSetting.findMany({where:{key:{in:Object.keys(SCHEMAS)}},orderBy:{key:"asc"}});
 const v:Record<string,unknown>={...DEFAULTS};for(const row of rows)v[row.key]=row.value;
 return v as typeof DEFAULTS;
}
export async function updateSystemSetting<K extends SystemSettingKey>(key:K,value:z.infer<(typeof SCHEMAS)[K]>){
 const actor=await assertPermission(PERMISSIONS.PLATFORM_MANAGE),parsed=SCHEMAS[key].parse(value),isPublic=PUBLIC_KEYS.includes(key);
 const saved=await prisma.systemSetting.upsert({where:{key},create:{key,value:parsed,isPublic,updatedBy:actor.id},update:{value:parsed,isPublic,updatedBy:actor.id}});
 await writeAuditLog({actorId:actor.id,action:"platform.setting.updated",targetType:"SystemSetting",targetId:key,metadata:{key}});
 return saved;
}
