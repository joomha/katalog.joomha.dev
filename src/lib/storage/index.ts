import "server-only";
import { LocalStorageAdapter } from "./local.adapter";
import type { StorageAdapter } from "./types";
export type { StorageAdapter, StorageObjectMetadata, StoragePutInput } from "./types";
const localAdapter=new LocalStorageAdapter();
/** Provider-neutral adapter selection. Local filesystem is development-only. */
export function getStorageAdapter():StorageAdapter {
 const driver=process.env.STORAGE_DRIVER??"local";
 if(driver==="local"){
  if(process.env.NODE_ENV==="production")throw new Error("Local storage is disabled in production; configure an S3-compatible adapter before accepting uploads");
  return localAdapter;
 }
 throw new Error("S3 storage adapter is not configured; select a supported provider before setting STORAGE_DRIVER=s3");
}
