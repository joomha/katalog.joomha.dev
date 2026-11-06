import { NextResponse } from "next/server";
import { approveBusinessProposalInternally } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(_request: Request, { params }: { params: Promise<{ proposalId: string; revisionId: string }> }) {
  try {
    const { proposalId, revisionId } = await params;
    return NextResponse.json({ data: await approveBusinessProposalInternally(proposalId, revisionId) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
