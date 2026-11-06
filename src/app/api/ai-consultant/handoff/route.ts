import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/modules/identity/guards";
import { requestConsultationHandoff } from "@/modules/ai-consultant/services/handoff.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    let userId: string | undefined;
    try {
      userId = (await assertAuthenticated()).id;
    } catch {
      userId = undefined;
    }
    const result = await requestConsultationHandoff(body, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Permintaan handoff gagal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
