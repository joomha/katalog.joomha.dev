import "server-only";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { assertAuthenticated, assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { AccessDeniedError } from "@/modules/identity/types";
import { getStorageAdapter } from "@/lib/storage";
import { writeAuditLog } from "./audit.service";
import { getMaxUploadBytes } from "./settings.service";
import type { UploadStoredFileInput } from "./types";
const EXTENSION_MIME:Record<string,string>={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",txt:"text/plain",md:"text/markdown"};
function detectMime(bytes:Uint8Array,extension:string):string|null{
 const starts=(...sig:number[])=>sig.every((b,i)=>bytes[i]===b);
 if(starts(0x25,0x50,0x44,0x46,0x2d))return "application/pdf";
 if(starts(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a))return "image/png";
 if(starts(0xff,0xd8,0xff))return "image/jpeg";
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
 if(extension==="txt"||extension==="md"){try{new TextDecoder("utf-8",{fatal:true}).decode(bytes);return EXTENSION_MIME[extension];}catch{return null;}}
 return null;
}
function normalizeName(name:string){
 const base=path.basename(name).normalize("NFKC").replace(/[^\p{L}\p{N}._-]/gu,"_").slice(0,120);
 const extension=path.extname(base).slice(1).toLowerCase();
 if(!extension||!EXTENSION_MIME[extension])throw new Error("File extension is not allowed");
 return {name:base,extension};
}
export async function uploadStoredFile(input:UploadStoredFileInput){
 const actor=await assertAuthenticated();
 if(input.ownerId&&input.ownerId!==actor.id)await assertPermission(PERMISSIONS.PLATFORM_MANAGE);
 if(input.visibility==="PUBLIC"&&!actor.roles.includes("SUPERADMIN"))await assertPermission(PERMISSIONS.PLATFORM_MANAGE);
 const {name,extension}=normalizeName(input.originalName),mime=detectMime(input.bytes,extension);
 if(!mime||mime!==EXTENSION_MIME[extension]||mime!==input.mimeType)throw new Error("File content does not match an allowed MIME type");
 const configuredMax=await getMaxUploadBytes(),requestedMax=Number.isFinite(input.maxSizeBytes)?Math.max(1,input.maxSizeBytes as number):configuredMax,max=Math.min(requestedMax,configuredMax);
 if(input.bytes.byteLength===0||input.bytes.byteLength>max)throw new Error("File size is outside the allowed range");
 const checksum=createHash("sha256").update(input.bytes).digest("hex"),key=checksum.slice(0,2)+"/"+randomUUID()+"."+extension;
 const adapter=getStorageAdapter();await adapter.put({key,bytes:input.bytes,contentType:mime});
 try{
  const stored=await prisma.storedFile.create({data:{ownerId:input.ownerId??actor.id,originalName:name,storageKey:key,provider:process.env.STORAGE_DRIVER??"local",mimeType:mime,extension,sizeBytes:BigInt(input.bytes.byteLength),checksumSha256:checksum,visibility:input.visibility??"PRIVATE",metadata:input.metadata?(input.metadata as Prisma.InputJsonObject):undefined}});
  await writeAuditLog({actorId:actor.id,action:"platform.file.uploaded",targetType:"StoredFile",targetId:stored.id,metadata:{mimeType:mime,sizeBytes:input.bytes.byteLength,visibility:stored.visibility}});
  return stored;
 }catch(error){await adapter.delete(key);throw error;}
}
export async function getAuthorizedFileAccess(fileId:string,authorizeEntitlement?:(file:{id:string;ownerId:string|null;metadata:unknown})=>Promise<boolean>){
 const file=await prisma.storedFile.findFirst({where:{id:fileId,status:"ACTIVE"}});
 if(!file)throw new Error("File not found");
 if(file.visibility==="PRIVATE"){
  const actor=await assertAuthenticated(),isOwner=file.ownerId===actor.id;
  let hasManage=false;
  try{await assertPermission(PERMISSIONS.PLATFORM_MANAGE);hasManage=true;}catch(error){if(!(error instanceof AccessDeniedError))throw error;}
  const entitled=authorizeEntitlement?await authorizeEntitlement({id:file.id,ownerId:file.ownerId,metadata:file.metadata}):false;
  if(!isOwner&&!hasManage&&!entitled)throw new Error("File access denied");
 }
 const bytes=await getStorageAdapter().get(file.storageKey);
 return {metadata:file,bytes};
}
export async function deleteStoredFile(fileId:string){
 const actor=await assertAuthenticated(),file=await prisma.storedFile.findFirst({where:{id:fileId,status:"ACTIVE"}});
 if(!file)return {deleted:false};
 if(file.ownerId!==actor.id)await assertPermission(PERMISSIONS.PLATFORM_MANAGE);
 await getStorageAdapter().delete(file.storageKey);
 await prisma.storedFile.update({where:{id:file.id},data:{status:"DELETED",deletedAt:new Date()}});
 await writeAuditLog({actorId:actor.id,action:"platform.file.deleted",targetType:"StoredFile",targetId:file.id});
 return {deleted:true};
}
export async function archiveStoredFile(fileId:string){
 const actor=await assertAuthenticated(),file=await prisma.storedFile.findFirst({where:{id:fileId,status:"ACTIVE"}});
 if(!file)return {archived:false};
 if(file.ownerId!==actor.id)await assertPermission(PERMISSIONS.PLATFORM_MANAGE);
 await prisma.storedFile.update({where:{id:file.id},data:{status:"ARCHIVED",archivedAt:new Date()}});
 await writeAuditLog({actorId:actor.id,action:"platform.file.archived",targetType:"StoredFile",targetId:file.id});
 return {archived:true};
}
