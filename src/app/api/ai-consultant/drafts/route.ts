import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/guards";
import { createConsultationDraft } from "@/modules/ai-consultant/services/draft.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const user = await getCurrentUser();
    const result = await createConsultationDraft(body, user?.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft gagal dibuat.";
    return NextResponse.json({ error: message }, { status: message.includes("akses ditolak") ? 403 : 400 });
  }
}
