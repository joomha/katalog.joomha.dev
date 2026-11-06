import { NextRequest, NextResponse } from "next/server";
import { updateBusinessProjectStatus } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await request.json() as { status?: unknown };
    if (typeof body.status !== "string") return NextResponse.json({ error: "Status proyek wajib diisi." }, { status: 400 });
    return NextResponse.json({ data: await updateBusinessProjectStatus(projectId, body.status as never) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
