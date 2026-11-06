import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import type { WriteAuditLogInput } from "./types";
const SENSITIVE=/(password|secret|token|authorization|cookie|api.?key|card|cvv|email|phone|address)/i;
function sanitize(v:unknown,d=0):unknown{
 if(d>5)return "[TRUNCATED]";
 if(Array.isArray(v))return v.slice(0,30).map(x=>sanitize(x,d+1));
 if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v as Record<string,unknown>).slice(0,50).map(([k,x])=>[k,SENSITIVE.test(k)?"[REDACTED]":sanitize(x,d+1)]));
 if(typeof v==="string")return v.slice(0,500);
 if(typeof v==="number"||typeof v==="boolean"||v===null)return v;
 return String(v).slice(0,100);
}
export async function writeAuditLog(input:WriteAuditLogInput){
 if(input.actorId)await assertPermission(PERMISSIONS.PLATFORM_MANAGE);
 const action=input.action.trim().slice(0,120),targetType=input.targetType.trim().slice(0,100);
 if(!action||!targetType)throw new Error("Audit action and targetType are required");
 return prisma.auditLog.create({data:{
  actorId:input.actorId??null,action,targetType,targetId:input.targetId?.slice(0,128)??null,
  metadata:input.metadata?(sanitize(input.metadata) as object):undefined,
  correlationId:input.correlationId?.slice(0,128)??null,ipAddress:null
 }});
}
export async function listAuditLogs(options:{limit?:number;cursor?:string}={}){
 await assertPermission(PERMISSIONS.PLATFORM_VIEW);
 const take=Math.max(1,Math.min(options.limit??50,100));
 return prisma.auditLog.findMany({orderBy:{createdAt:"desc"},take,...(options.cursor?{cursor:{id:options.cursor},skip:1}:{})});
}
