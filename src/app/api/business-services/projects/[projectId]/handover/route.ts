import { NextRequest, NextResponse } from "next/server";
import { initiateProjectHandover } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body: unknown = await request.json();
    return NextResponse.json({ data: await initiateProjectHandover(projectId, body) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
