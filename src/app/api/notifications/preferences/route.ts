import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getNotificationPreferences, updateNotificationPreference } from "@/modules/platform";
import { NotificationCategory } from "@prisma/client";
import { UnauthenticatedError } from "@/modules/identity/types";
const schema=z.object({category:z.nativeEnum(NotificationCategory),inAppEnabled:z.boolean().optional(),emailEnabled:z.boolean().optional()}).refine(value=>value.inAppEnabled!==undefined||value.emailEnabled!==undefined);
export async function GET(){
 try{return NextResponse.json({items:await getNotificationPreferences()});}
 catch(error){if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});return NextResponse.json({error:"INTERNAL_ERROR"},{status:500});}
}
export async function PATCH(request:Request){
 try{const body=schema.parse(await request.json());return NextResponse.json(await updateNotificationPreference(body.category,{inAppEnabled:body.inAppEnabled,emailEnabled:body.emailEnabled}));}
 catch(error){if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});if(error instanceof ZodError)return NextResponse.json({error:"INVALID_PREFERENCE",details:error.flatten()},{status:400});return NextResponse.json({error:"INTERNAL_ERROR"},{status:500});}
}
