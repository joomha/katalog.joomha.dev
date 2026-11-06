import "server-only";
import { LocalStorageAdapter } from "./local.adapter";
import type { StorageAdapter } from "./types";
export type { StorageAdapter, StorageObjectMetadata, StoragePutInput } from "./types";
const localAdapter=new LocalStorageAdapter();
/** Provider selection stays behind a provider-neutral contract. S3 is intentionally unavailable until credentials/SDK are selected. */
export function getStorageAdapter():StorageAdapter {
 const driver=process.env.STORAGE_DRIVER??"local";
 if(driver==="local")return localAdapter;
 throw new Error("S3 storage adapter is not configured; set STORAGE_DRIVER=local or implement the selected S3 provider");
}
