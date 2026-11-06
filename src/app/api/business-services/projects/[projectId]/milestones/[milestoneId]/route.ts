import { NextRequest, NextResponse } from "next/server";
import { updateProjectMilestone } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string; milestoneId: string }> }) {
  try {
    const { milestoneId } = await params;
    const body: unknown = await request.json();
    return NextResponse.json({ data: await updateProjectMilestone(milestoneId, body) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
