import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/modules/identity/guards";
import { sendConsultationMessage } from "@/modules/ai-consultant/services/consultation.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    let userId: string | undefined;
    try {
      const user = await assertAuthenticated();
      userId = user.id;
    } catch {
      userId = undefined;
    }
    const result = await sendConsultationMessage(body, userId);
    return NextResponse.json(result, { status: result.assistantUnavailable ? 503 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Permintaan konsultasi gagal diproses.";
    const status = message.includes("akses ditolak") ? 403 : message.includes("tidak valid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
