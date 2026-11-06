import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { updateSystemSetting } from "@/modules/platform";
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
  const body=schema.parse(await request.json());
  const result=await updateSystemSetting(body.key,body.value as never);
  return NextResponse.json({key:result.key,updatedAt:result.updatedAt});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_SETTING",details:error.flatten()},{status:400});
  if(error instanceof Error&&(error.message.includes("Access denied")||error.message.includes("permission")))return NextResponse.json({error:"FORBIDDEN"},{status:403});
  return NextResponse.json({error:"SETTING_UPDATE_FAILED"},{status:400});
 }
}
