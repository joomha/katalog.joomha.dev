import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/guards";
import { listConsultations } from "@/modules/ai-consultant/services/consultation.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Login diperlukan untuk melihat riwayat konsultasi." }, { status: 401 });
    const conversations = await listConsultations(user.id);
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Riwayat konsultasi gagal dimuat." }, { status: 500 });
  }
}
