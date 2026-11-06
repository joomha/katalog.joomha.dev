import { NextRequest, NextResponse } from "next/server";
import { addProjectProgressUpdate } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body: unknown = await request.json();
    return NextResponse.json({ data: await addProjectProgressUpdate(projectId, body) }, { status: 201 });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
