import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertAuthenticated, assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import type { CreateNotificationInput, NotificationListOptions } from "./types";
import { sendEmailWithRetry } from "./notification-email";
const SAFE_PATH=/^\/(?!\/)[\w\-/?.=&%#]*$/;
function safePath(path?:string){if(!path)return null;let decoded:string;try{decoded=decodeURIComponent(path);}catch{throw new Error("Invalid notification resource path");}if(!SAFE_PATH.test(path)||decoded.startsWith("//")||decoded.includes(".."))throw new Error("Unsafe notification resource path");return path;}
async function persistNotification(input:CreateNotificationInput){
 const title=input.title.trim().slice(0,160),body=input.body.trim().slice(0,1200);
 if(input.dedupeKey&&input.dedupeKey.length>240)throw new Error("Notification dedupe key is too long");
 if(!title||!body)throw new Error("Notification title and body are required");
 const pref=await prisma.notificationPreference.findUnique({where:{userId_category:{userId:input.userId,category:input.category}}});
 let notification=null,created=true;
 const data={userId:input.userId,category:input.category,title,body,resourceUrl:safePath(input.resourceUrl),eventName:input.eventName??null,dedupeKey:input.dedupeKey??null};
 if(input.dedupeKey){
  try{notification=await prisma.notification.create({data});}
  catch(error){if((error as {code?:string}).code!=="P2002")throw error;notification=await prisma.notification.findUnique({where:{dedupeKey:input.dedupeKey}});created=false;}
 }else notification=await prisma.notification.create({data});
 const emailEnabled=input.category==="TRANSACTIONAL"||pref?.emailEnabled!==false;
 if(created&&emailEnabled){
  const user=await prisma.user.findUnique({where:{id:input.userId},select:{email:true,isActive:true,emailVerified:true}});
  if(user?.isActive&&user.emailVerified){
   const result=await sendEmailWithRetry({to:user.email,subject:"Pemberitahuan Joomha Education",text:"Anda memiliki pemberitahuan baru di akun Joomha Education. Silakan masuk ke akun Anda untuk melihat detailnya."});
   if(!result.ok)console.error("[platform:email-failed]",{userId:input.userId,category:input.category,errorCode:result.errorCode});
  }
 }
 return notification;
}
export async function createNotification(input:CreateNotificationInput){await assertPermission(PERMISSIONS.PLATFORM_MANAGE);return persistNotification(input);}
export async function createNotificationFromSystemEvent(input:CreateNotificationInput){return persistNotification(input);}
export async function createNotifications(inputs:CreateNotificationInput[]){await assertPermission(PERMISSIONS.PLATFORM_MANAGE);const out=[];for(const input of inputs)out.push(await persistNotification(input));return out;}
export async function listNotificationsForUser(options:NotificationListOptions={}){
 const user=await assertAuthenticated(),disabled=await prisma.notificationPreference.findMany({where:{userId:user.id,inAppEnabled:false},select:{category:true}});
 const hiddenCategories=disabled.map(item=>item.category).filter(category=>category!=="TRANSACTIONAL");
 const take=Math.max(1,Math.min(options.limit??20,100)),where={userId:user.id,category:{notIn:hiddenCategories},...(options.unreadOnly?{readAt:null}:{})};
 const [items,unreadCount]=await Promise.all([prisma.notification.findMany({where,select:{id:true,category:true,title:true,body:true,resourceUrl:true,readAt:true,createdAt:true},orderBy:{createdAt:"desc"},take,...(options.cursor?{cursor:{id:options.cursor},skip:1}:{})}),prisma.notification.count({where:{userId:user.id,category:{notIn:hiddenCategories},readAt:null}})]);
 return {items,unreadCount};
}
export async function markNotificationRead(id:string){const user=await assertAuthenticated();const result=await prisma.notification.updateMany({where:{id,userId:user.id,readAt:null},data:{readAt:new Date()}});return {updated:result.count===1};}
export async function markAllNotificationsRead(){const user=await assertAuthenticated();const result=await prisma.notification.updateMany({where:{userId:user.id,readAt:null},data:{readAt:new Date()}});return {updatedCount:result.count};}
export async function getNotificationPreferences(){
 const user=await assertAuthenticated(),items=await prisma.notificationPreference.findMany({where:{userId:user.id},select:{category:true,inAppEnabled:true,emailEnabled:true},orderBy:{category:"asc"}});
 return items.map(item=>item.category==="TRANSACTIONAL"?{...item,inAppEnabled:true,emailEnabled:true}:item);
}
export async function updateNotificationPreference(category:CreateNotificationInput["category"],values:{inAppEnabled?:boolean;emailEnabled?:boolean}){
 const user=await assertAuthenticated();if(category==="TRANSACTIONAL")throw new Error("Transactional notifications cannot be disabled");
 return prisma.notificationPreference.upsert({where:{userId_category:{userId:user.id,category}},create:{userId:user.id,category,inAppEnabled:values.inAppEnabled??true,emailEnabled:values.emailEnabled??true},update:values,select:{category:true,inAppEnabled:true,emailEnabled:true}});
}
