/** Public API for shared platform services. */
import "./event-subscriber";
export { createNotification, createNotifications, listNotificationsForUser, markNotificationRead, markAllNotificationsRead, getNotificationPreferences, updateNotificationPreference } from "./notification.service";
export { handlePlatformDomainEvent, type PlatformDomainEvent } from "./notification-events";
export { emailAdapter, sendEmailWithRetry, ConsoleEmailAdapter } from "./notification-email";
export type { EmailAdapter } from "./notification-email";
export { writeAuditLog, listAuditLogs } from "./audit.service";
export { uploadStoredFile, getAuthorizedFileAccess, getStoredFileMetadata, deleteStoredFile, archiveStoredFile } from "./storage.service";
export { getPublicSystemSettings, getAdminSystemSettings, updateSystemSetting } from "./settings.service";
export { getAdminOverview } from "./overview.service";
export type { CreateNotificationInput, NotificationListOptions, WriteAuditLogInput, UploadStoredFileInput, StoredFileMetadata, PublicSystemSettings, EmailMessage, EmailSendResult } from "./types";
