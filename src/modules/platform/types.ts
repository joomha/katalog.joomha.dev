import type { NotificationCategory, StoredFileVisibility, StoredFileStatus } from "@prisma/client";
export type { NotificationCategory, StoredFileVisibility, StoredFileStatus };
export interface CreateNotificationInput {
 userId:string; category:NotificationCategory; title:string; body:string;
 resourceUrl?:string; eventName?:string; dedupeKey?:string;
}
export interface NotificationListOptions { limit?:number; unreadOnly?:boolean; cursor?:string }
export interface WriteAuditLogInput {
 actorId?:string|null; action:string; targetType:string; targetId?:string|null;
 metadata?:Record<string,unknown>; correlationId?:string|null;
}
export interface UploadStoredFileInput {
 ownerId?:string; originalName:string; mimeType:string; bytes:Uint8Array;
 visibility?:StoredFileVisibility; maxSizeBytes?:number; metadata?:Record<string,unknown>;
}
export interface StoredFileMetadata {
 id:string; ownerId:string|null; originalName:string; mimeType:string; extension:string;
 sizeBytes:number; visibility:StoredFileVisibility; status:StoredFileStatus;
 metadata:unknown; createdAt:Date; updatedAt:Date;
}
export interface EmailMessage { to:string; subject:string; text:string }
export type EmailSendResult = {ok:true;providerMessageId?:string}|{ok:false;retryable:boolean;errorCode:string};
