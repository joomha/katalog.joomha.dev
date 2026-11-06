import { NextResponse } from "next/server";
import { listBusinessServiceDefinitions } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function GET() {
  try {
    return NextResponse.json({ data: await listBusinessServiceDefinitions() });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
