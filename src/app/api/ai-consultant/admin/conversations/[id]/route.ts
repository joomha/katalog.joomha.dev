import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/modules/identity/guards";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const runtime = "nodejs";
const assignSchema = z.object({ assignedUserId: z.string().uuid() });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await assertRole(["ADMIN", "SUPERADMIN", "INSTRUCTOR"]);
    const { id } = await context.params;
    const where = admin.roles.includes("INSTRUCTOR") && !admin.roles.includes("ADMIN") && !admin.roles.includes("SUPERADMIN")
      ? { id, assignedUserId: admin.id }
      : { id };
    const conversation = await prisma.consultationConversation.findFirst({
      where,
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        lead: true,
        summary: true,
      },
    });
    if (!conversation) return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: "Akses admin/instruktur diperlukan." }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await assertRole(["ADMIN", "SUPERADMIN"]);
    const parsed = assignSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Penugasan tidak valid." }, { status: 400 });
    const { id } = await context.params;
    const updated = await prisma.consultationConversation.update({
      where: { id },
      data: { assignedUserId: parsed.data.assignedUserId, status: "HUMAN_ASSIGNED" },
      select: { id: true, assignedUserId: true, status: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Penugasan gagal atau akses ditolak." }, { status: 403 });
  }
}
