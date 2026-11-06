import { NextResponse } from "next/server";
import { listCustomerBusinessProjects } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function GET() {
  try {
    return NextResponse.json({ data: await listCustomerBusinessProjects() });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
