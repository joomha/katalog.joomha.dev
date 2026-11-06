import { NextResponse } from "next/server";
import { getBusinessServiceDefinitionBySlug } from "@/modules/business-services";
import { businessServiceErrorResponse } from "@/modules/business-services/http";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const service = await getBusinessServiceDefinitionBySlug(slug);
    if (!service) return NextResponse.json({ error: "Detail jasa tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ data: service });
  } catch (error) {
    return businessServiceErrorResponse(error);
  }
}
