import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/modules/identity/guards";
import { OpenRouterEmbeddingProvider } from "@/modules/ai-consultant/rag/openrouter-embedding.provider";
import { indexKnowledgeText } from "@/modules/ai-consultant/rag/indexing";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const runtime = "nodejs";
const uploadSchema = z.object({
  title: z.string().trim().min(2).max(180),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["text/plain", "text/markdown"]),
  text: z.string().min(1).max(5 * 1024 * 1024),
  visibility: z.enum(["PUBLIC", "CUSTOMER", "STAFF", "ADMIN"]).default("STAFF"),
});

export async function GET() {
  try {
    await assertRole(["ADMIN", "SUPERADMIN"]);
    const documents = await prisma.knowledgeDocument.findMany({
      select: { id: true, title: true, originalName: true, mimeType: true, status: true, visibility: true, chunkCount: true, errorMessage: true, indexedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 100,
    });
    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await assertRole(["ADMIN", "SUPERADMIN"]);
    const parsed = uploadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data dokumen tidak valid.", issues: parsed.error.flatten() }, { status: 400 });
    const result = await indexKnowledgeText({ ...parsed.data, uploadedBy: admin.id }, new OpenRouterEmbeddingProvider());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dokumen gagal diindeks.";
    return NextResponse.json({ error: message }, { status: message.includes("Akses") ? 403 : 422 });
  }
}
