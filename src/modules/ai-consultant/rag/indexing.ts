import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { EmbeddingProvider } from "../providers/provider.types";
import { chunkKnowledgeText } from "./chunking";

export interface KnowledgeDocumentStorage {
  put(input: { key: string; bytes: Uint8Array; contentType: string }): Promise<{ key: string }>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

const ALLOWED_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function indexKnowledgeText(input: {
  title: string;
  originalName: string;
  mimeType: string;
  text: string;
  visibility?: "PUBLIC" | "CUSTOMER" | "STAFF" | "ADMIN";
  uploadedBy?: string;
}, embeddingProvider: EmbeddingProvider) {
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new Error("Format dokumen belum didukung oleh extractor aktif. Gunakan TXT atau Markdown.");
  }
  if (new TextEncoder().encode(input.text).byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran dokumen melebihi batas 5 MB.");
  }
  const expectedDimensions = Number(process.env.OPENROUTER_EMBEDDING_DIMENSIONS || 1536);
  if (!Number.isInteger(expectedDimensions) || expectedDimensions < 1 || expectedDimensions > 8192) throw new Error("OPENROUTER_EMBEDDING_DIMENSIONS tidak valid.");
  const chunks = chunkKnowledgeText(input.text);
  if (!chunks.length) throw new Error("Dokumen tidak berisi teks yang dapat diindeks.");
  const document = await prisma.knowledgeDocument.create({
    data: {
      title: input.title.trim().slice(0, 180),
      originalName: input.originalName.slice(0, 255),
      mimeType: input.mimeType,
      visibility: input.visibility ?? "STAFF",
      uploadedBy: input.uploadedBy,
      status: "INDEXING",
    },
  });
  try {
    const vectors = await embeddingProvider.embed(chunks.map((chunk) => chunk.content));
    if (vectors.length !== chunks.length || vectors.some((vector) => vector.length !== expectedDimensions)) {
      throw new Error("Dimensi embedding harus konsisten dengan OPENROUTER_EMBEDDING_DIMENSIONS.");
    }
    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < chunks.length; index += 1) {
        const vector = `[${vectors[index].join(",")}]`;
        await tx.$executeRaw`
          INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, embedding, created_at)
          VALUES (gen_random_uuid(), ${document.id}::uuid, ${chunks[index].index}, ${chunks[index].content}, ${vector}::vector, NOW())
        `;
      }
      await tx.knowledgeDocument.update({
        where: { id: document.id },
        data: { status: "INDEXED", chunkCount: chunks.length, indexedAt: new Date() },
      });
    });
    return { id: document.id, status: "INDEXED" as const, chunkCount: chunks.length };
  } catch (error) {
    await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Indexing failed" },
    });
    throw error;
  }
}
