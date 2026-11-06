import "server-only";
import { prisma } from "@/lib/db/prisma";
import { assertAuthenticated, assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";
import { AccessDeniedError } from "@/modules/identity/types";
export async function getAdminOverview(){
 const admin=await assertAuthenticated();
 if(!admin.roles.some(role=>role==="ADMIN"||role==="SUPERADMIN"||role==="INSTRUCTOR"))throw new AccessDeniedError();
 let canViewPlatform=admin.roles.includes("SUPERADMIN");
 if(!canViewPlatform){try{await assertPermission(PERMISSIONS.PLATFORM_VIEW);canViewPlatform=true;}catch(error){if(!(error instanceof AccessDeniedError))throw error;}}
 const [unreadNotifications,recentNotifications,platformCounts]=await Promise.all([
  prisma.notification.count({where:{userId:admin.id,readAt:null}}),
  prisma.notification.findMany({where:{userId:admin.id},orderBy:{createdAt:"desc"},take:5}),
  canViewPlatform?Promise.all([prisma.storedFile.count({where:{status:"ACTIVE"}}),prisma.auditLog.count()]):Promise.resolve(null)
 ]);
 return {admin,unreadNotifications,recentNotifications,activeFiles:platformCounts?.[0]??null,auditCount:platformCounts?.[1]??null,canViewPlatform};
}
