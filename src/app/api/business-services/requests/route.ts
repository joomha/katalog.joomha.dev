import { NextRequest, NextResponse } from "next/server";
import { createBusinessServiceRequest, listCustomerBusinessRequests } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function GET() {
  try {
    return NextResponse.json({ data: await listCustomerBusinessRequests() });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const created = await createBusinessServiceRequest(body as never);
    return NextResponse.json({ data: created, message: "Permintaan proyek berhasil dicatat." }, { status: 201 });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
