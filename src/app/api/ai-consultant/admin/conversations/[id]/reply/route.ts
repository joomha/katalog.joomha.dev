import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/modules/identity/guards";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const runtime = "nodejs";
const replySchema = z.object({ message: z.string().trim().min(1).max(8000) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await assertRole(["ADMIN", "SUPERADMIN", "INSTRUCTOR"]);
    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Balasan tidak valid." }, { status: 400 });
    const { id } = await context.params;
    const conversation = await prisma.consultationConversation.findUnique({ where: { id } });
    if (!conversation || ["CLOSED", "CANCELLED"].includes(conversation.status)) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan atau sudah ditutup." }, { status: 404 });
    }
    const message = await prisma.consultationMessage.create({
      data: { conversationId: id, role: "ADMIN", content: parsed.data.message, metadata: { senderUserId: admin.id } },
    });
    await prisma.consultationConversation.update({
      where: { id }, data: { status: "HUMAN_ASSIGNED", assignedUserId: admin.id, lastMessageAt: message.createdAt },
    });
    return NextResponse.json({ messageId: message.id, status: "HUMAN_ASSIGNED" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Balasan admin gagal dikirim.";
    return NextResponse.json({ error: message }, { status: message.includes("akses") ? 403 : 401 });
  }
}
