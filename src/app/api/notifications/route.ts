import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { listNotificationsForUser } from "@/modules/platform";
import { UnauthenticatedError } from "@/modules/identity/types";
const querySchema=z.object({limit:z.coerce.number().int().min(1).max(100).default(20),unreadOnly:z.enum(["true","false"]).optional(),cursor:z.string().uuid().optional()});
export async function GET(request:Request){
 try{
  const url=new URL(request.url),query=querySchema.parse(Object.fromEntries(url.searchParams));
  return NextResponse.json(await listNotificationsForUser({limit:query.limit,unreadOnly:query.unreadOnly==="true",cursor:query.cursor}));
 }catch(error){
  if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_QUERY",details:error.flatten()},{status:400});
  return NextResponse.json({error:"INTERNAL_ERROR"},{status:500});
 }
}
