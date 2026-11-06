import { NextRequest, NextResponse } from "next/server";
import { decideBusinessProposal } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ proposalId: string; revisionId: string }> }) {
  try {
    const { proposalId, revisionId } = await params;
    const body: unknown = await request.json();
    return NextResponse.json({ data: await decideBusinessProposal(proposalId, revisionId, body) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
