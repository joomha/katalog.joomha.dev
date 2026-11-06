import { NextResponse } from "next/server";
import { confirmProjectHandover } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    return NextResponse.json({ data: await confirmProjectHandover(projectId) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
