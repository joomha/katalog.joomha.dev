import { NextRequest, NextResponse } from "next/server";
import { reviseBusinessProposal } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ proposalId: string }> }) {
  try {
    const { proposalId } = await params;
    const body: unknown = await request.json();
    return NextResponse.json({ data: await reviseBusinessProposal(proposalId, body as never) }, { status: 201 });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
