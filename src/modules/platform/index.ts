/** Public API for shared platform services. Import domain services only through this module. */
export { createNotification, createNotifications, listNotificationsForUser, markNotificationRead, markAllNotificationsRead, updateNotificationPreference } from "./notification.service";
export { writeAuditLog, listAuditLogs } from "./audit.service";
export { uploadStoredFile, getAuthorizedFileAccess, deleteStoredFile } from "./storage.service";
export { getPublicSystemSettings, getAdminSystemSettings, updateSystemSetting } from "./settings.service";
export type { CreateNotificationInput, NotificationListOptions, WriteAuditLogInput, UploadStoredFileInput, PublicSystemSettings } from "./types";
