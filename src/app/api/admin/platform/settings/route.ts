import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { updateSystemSetting } from "@/modules/platform";
import { AccessDeniedError, UnauthenticatedError } from "@/modules/identity/types";
const schema=z.discriminatedUnion("key",[
 z.object({key:z.literal("brandDisplayName"),value:z.string()}),
 z.object({key:z.literal("supportContact"),value:z.string()}),
 z.object({key:z.literal("currency"),value:z.literal("IDR")}),
 z.object({key:z.literal("timezone"),value:z.string()}),
 z.object({key:z.literal("maxUploadBytes"),value:z.number()}),
 z.object({key:z.literal("maintenanceBanner"),value:z.string()})
]);
export async function PATCH(request:Request){
 try{
  const body=schema.parse(await request.json()),result=await updateSystemSetting(body.key,body.value as never);
  return NextResponse.json({key:result.key,updatedAt:result.updatedAt});
 }catch(error){
  if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
  if(error instanceof AccessDeniedError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_SETTING",details:error.flatten()},{status:400});
  return NextResponse.json({error:"SETTING_UPDATE_FAILED"},{status:400});
 }
}
