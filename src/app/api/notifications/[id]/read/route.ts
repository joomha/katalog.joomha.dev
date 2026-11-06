import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { markNotificationRead } from "@/modules/platform";
import { UnauthenticatedError } from "@/modules/identity/types";
const paramsSchema=z.object({id:z.string().uuid()});
export async function PATCH(_request:Request,context:{params:Promise<{id:string}>}){
 try{
  const params=paramsSchema.parse(await context.params),result=await markNotificationRead(params.id);
  return NextResponse.json(result,{status:result.updated?200:404});
 }catch(error){
  if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_ID"},{status:400});
  return NextResponse.json({error:"INTERNAL_ERROR"},{status:500});
 }
}
