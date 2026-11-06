import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthorizedFileAccess } from "@/modules/platform";
import { UnauthenticatedError, AccessDeniedError } from "@/modules/identity/types";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 try{
  const {id}=z.object({id:z.string().uuid()}).parse(await context.params),result=await getAuthorizedFileAccess(id);
  const asciiName=result.metadata.originalName.replace(/[^\x20-\x7e]/g,"_").replace(/["\\\\]/g,"_");
  const encodedName=encodeURIComponent(result.metadata.originalName);
  return new Response(Buffer.from(result.bytes),{headers:{
   "Content-Type":result.metadata.mimeType,
   "Content-Length":String(result.metadata.sizeBytes),
   "Content-Disposition":"attachment; filename=\""+asciiName+"\"; filename*=UTF-8"+String.fromCharCode(39,39)+encodedName,
   "X-Content-Type-Options":"nosniff",
   "Cache-Control":result.metadata.visibility==="PRIVATE"?"private, no-store":"public, max-age=300"
  }});
 }catch(error){
  if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_FILE_ID"},{status:400});
  if(error instanceof AccessDeniedError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const message=error instanceof Error?error.message:"";
  if(message==="File access denied")return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(message==="File not found")return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return NextResponse.json({error:"FILE_ACCESS_FAILED"},{status:500});
 }
}
