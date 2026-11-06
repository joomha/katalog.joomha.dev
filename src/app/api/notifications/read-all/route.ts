import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/modules/platform";
import { UnauthenticatedError } from "@/modules/identity/types";
export async function POST(){
 try{return NextResponse.json(await markAllNotificationsRead());}
 catch(error){if(error instanceof UnauthenticatedError)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});return NextResponse.json({error:"INTERNAL_ERROR"},{status:500});}
}
