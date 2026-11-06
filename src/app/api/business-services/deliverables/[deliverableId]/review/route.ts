import { NextRequest, NextResponse } from "next/server";
import { reviewProjectDeliverable } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ deliverableId: string }> }) {
  try {
    const { deliverableId } = await params;
    const body: unknown = await request.json();
    return NextResponse.json({ data: await reviewProjectDeliverable(deliverableId, body) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
