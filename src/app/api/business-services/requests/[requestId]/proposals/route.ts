import { NextRequest, NextResponse } from "next/server";
import { createBusinessProposalDraft } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const body: unknown = await request.json();
    const proposal = await createBusinessProposalDraft(requestId, body as never);
    return NextResponse.json({ data: proposal }, { status: 201 });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
