export interface StoragePutInput { key:string; bytes:Uint8Array; contentType:string }
export interface StorageObjectMetadata { key:string; sizeBytes:number; contentType:string }
export interface StorageAdapter {
 put(input:StoragePutInput):Promise<StorageObjectMetadata>;
 get(key:string):Promise<Uint8Array>;
 head(key:string):Promise<StorageObjectMetadata|null>;
 delete(key:string):Promise<void>;
}
