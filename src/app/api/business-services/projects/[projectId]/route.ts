import { NextResponse } from "next/server";
import { getCustomerBusinessProjectProgress } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    return NextResponse.json({ data: await getCustomerBusinessProjectProgress(projectId) });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
