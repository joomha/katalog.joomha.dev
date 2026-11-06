import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/guards";
import { requestConsultationHandoff } from "@/modules/ai-consultant/services/handoff.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const user = await getCurrentUser();
    const result = await requestConsultationHandoff(body, user?.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Permintaan handoff gagal.";
    const status = message.includes("akses ditolak") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
