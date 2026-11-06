/** Public API for shared platform services. */
import "./event-subscriber";
export { createNotification, createNotifications, listNotificationsForUser, markNotificationRead, markAllNotificationsRead, updateNotificationPreference } from "./notification.service";
export { handlePlatformDomainEvent, type PlatformDomainEvent } from "./notification-events";
export { writeAuditLog, listAuditLogs } from "./audit.service";
export { uploadStoredFile, getAuthorizedFileAccess, deleteStoredFile, archiveStoredFile } from "./storage.service";
export { getPublicSystemSettings, getAdminSystemSettings, updateSystemSetting } from "./settings.service";
export type { CreateNotificationInput, NotificationListOptions, WriteAuditLogInput, UploadStoredFileInput, PublicSystemSettings } from "./types";
