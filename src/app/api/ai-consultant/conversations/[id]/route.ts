import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/guards";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Login diperlukan untuk melihat riwayat ini." }, { status: 401 });
    const { id } = await context.params;
    const conversation = await prisma.consultationConversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true, mode: true, status: true, createdAt: true, updatedAt: true,
        messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, createdAt: true } },
        summary: { select: { payload: true, generatedAt: true } } },
    });
    if (!conversation) return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: "Riwayat konsultasi gagal dimuat." }, { status: 500 });
  }
}
