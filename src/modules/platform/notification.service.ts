import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertAuthenticated } from "@/modules/identity/guards";
import type { CreateNotificationInput, NotificationListOptions } from "./types";
import { sendEmailWithRetry } from "./notification-email";
const SAFE_PATH=/^\/(?!\/)[\w\-/?.=&%#]*$/;
function safePath(path?:string){if(!path)return null;if(!SAFE_PATH.test(path)||path.includes(".."))throw new Error("Unsafe notification resource path");return path;}
export async function createNotification(input:CreateNotificationInput){
 const title=input.title.trim().slice(0,160),body=input.body.trim().slice(0,1200);
 if(!title||!body)throw new Error("Notification title and body are required");
 const pref=await prisma.notificationPreference.findUnique({where:{userId_category:{userId:input.userId,category:input.category}}});
 let notification=null;
 if(pref?.inAppEnabled!==false){
  const data={userId:input.userId,category:input.category,title,body,resourceUrl:safePath(input.resourceUrl),eventName:input.eventName??null,dedupeKey:input.dedupeKey??null};
  notification=input.dedupeKey
   ? await prisma.notification.upsert({where:{dedupeKey:input.dedupeKey},create:data,update:{}})
   : await prisma.notification.create({data});
 }
 if(input.email&&pref?.emailEnabled!==false){
  const result=await sendEmailWithRetry({to:input.email.to,subject:input.email.subject.trim().slice(0,120),text:input.email.text.trim().slice(0,500)});
  if(!result.ok)console.error("[platform:email-failed]",{userId:input.userId,category:input.category,errorCode:result.errorCode});
 }
 return notification;
}
export async function createNotifications(inputs:CreateNotificationInput[]){const out=[];for(const input of inputs)out.push(await createNotification(input));return out;}
export async function listNotificationsForUser(options:NotificationListOptions={}){
 const user=await assertAuthenticated(),take=Math.max(1,Math.min(options.limit??20,100));
 const where={userId:user.id,...(options.unreadOnly?{readAt:null}:{})};
 const [items,unreadCount]=await Promise.all([
  prisma.notification.findMany({where,orderBy:{createdAt:"desc"},take,...(options.cursor?{cursor:{id:options.cursor},skip:1}:{})}),
  prisma.notification.count({where:{userId:user.id,readAt:null}})
 ]);
 return {items,unreadCount};
}
export async function markNotificationRead(id:string){
 const user=await assertAuthenticated();
 const result=await prisma.notification.updateMany({where:{id,userId:user.id,readAt:null},data:{readAt:new Date()}});
 return {updated:result.count===1};
}
export async function markAllNotificationsRead(){
 const user=await assertAuthenticated();
 const result=await prisma.notification.updateMany({where:{userId:user.id,readAt:null},data:{readAt:new Date()}});
 return {updatedCount:result.count};
}
export async function updateNotificationPreference(category:CreateNotificationInput["category"],values:{inAppEnabled?:boolean;emailEnabled?:boolean}){
 const user=await assertAuthenticated();
 return prisma.notificationPreference.upsert({
  where:{userId_category:{userId:user.id,category}},
  create:{userId:user.id,category,inAppEnabled:values.inAppEnabled??true,emailEnabled:values.emailEnabled??true},
  update:values
 });
}
