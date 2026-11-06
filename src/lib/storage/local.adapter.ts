import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter, StorageObjectMetadata, StoragePutInput } from "./types";

function storageRoot() {
 const configured=process.env.STORAGE_LOCAL_ROOT??"./var/private-files";
 const root=path.resolve(process.cwd(),configured);
 const publicRoot=path.resolve(process.cwd(),"public");
 if(root===publicRoot||root.startsWith(publicRoot+path.sep)) throw new Error("Private storage must be outside public/");
 return root;
}
function resolveKey(key:string){
 if(!/^[a-f0-9]{2}\/[a-f0-9-]{36}\.[a-z0-9]{1,8}$/.test(key))throw new Error("Invalid storage key");
 const root=storageRoot(),target=path.resolve(root,key);
 if(!target.startsWith(root+path.sep))throw new Error("Invalid storage path");
 return target;
}
export class LocalStorageAdapter implements StorageAdapter {
 async put(input:StoragePutInput):Promise<StorageObjectMetadata>{
  const target=resolveKey(input.key);await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,input.bytes,{flag:"wx",mode:0o600});
  return {key:input.key,sizeBytes:input.bytes.byteLength,contentType:input.contentType};
 }
 async get(key:string){return new Uint8Array(await readFile(resolveKey(key)));}
 async head(key:string):Promise<StorageObjectMetadata|null>{
  try{const info=await stat(resolveKey(key));return {key,sizeBytes:info.size,contentType:"application/octet-stream"};}
  catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return null;throw error;}
 }
 async delete(key:string){try{await unlink(resolveKey(key));}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}}
}
