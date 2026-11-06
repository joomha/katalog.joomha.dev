import { NextResponse } from "next/server";
import { getAuthorizedFileAccess } from "@/modules/platform";
import { UnauthenticatedError, AccessDeniedError } from "@/modules/identity/types";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 try{
  const {id}=await context.params,result=await getAuthorizedFileAccess(id);
  return new Response(Buffer.from(result.bytes),{headers:{
   "Content-Type":result.metadata.mimeType,
   "Content-Length":String(result.metadata.sizeBytes),
   "Content-Disposition":'attachment; filename="'+result.metadata.originalName.replace(/["\\\\\r\n]/g,"_")+'"',
   "X-Content-Type-Options":"nosniff",
   "Cache-Control":result.metadata.visibility==="PRIVATE"?"private, no-store":"public, max-age=300"
  }});
 }catch(error){
  if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  if(error instanceof AccessDeniedError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const message=error instanceof Error?error.message:"";
  if(message==="File access denied")return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(message==="File not found")return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return NextResponse.json({error:"FILE_ACCESS_FAILED"},{status:500});
 }
}
