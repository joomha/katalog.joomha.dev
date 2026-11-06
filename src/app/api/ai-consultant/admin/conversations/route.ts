import { NextResponse } from "next/server";
import { assertRole } from "@/modules/identity/guards";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await assertRole(["ADMIN", "SUPERADMIN", "INSTRUCTOR"]);
    const conversations = await prisma.consultationConversation.findMany({
      select: {
        id: true, userId: true, mode: true, status: true, handoffReason: true,
        assignedUserId: true, consentAt: true, consentScope: true, lastMessageAt: true, createdAt: true,
        lead: { select: { customerName: true, customerEmail: true, customerPhone: true, payload: true } },
        summary: { select: { payload: true, generatedAt: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { role: true, content: true, createdAt: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Akses admin/instruktur diperlukan." }, { status: 403 });
  }
}
