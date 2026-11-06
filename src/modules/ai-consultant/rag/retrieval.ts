import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { EmbeddingProvider } from "../providers/provider.types";

export interface RetrievedKnowledge {
  chunkId: string;
  documentId: string;
  title: string;
  content: string;
  distance: number;
}

export async function retrieveKnowledge(
  query: string,
  embeddingProvider: EmbeddingProvider,
  options: { limit?: number; roles?: string[] } = {},
): Promise<RetrievedKnowledge[]> {
  const text = query.trim();
  if (!text || text.length > 8_000) return [];
  const [vector] = await embeddingProvider.embed([text]);
  const expectedDimensions = Number(process.env.OPENROUTER_EMBEDDING_DIMENSIONS || 1536);
  if (!Number.isInteger(expectedDimensions) || !vector?.length || vector.length !== expectedDimensions) return [];
  const vectorLiteral = `[${vector.join(",")}]`;
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 10);
  const roles = options.roles ?? [];
  const roleFilter = roles.length
    ? Prisma.sql`cardinality(kd.allowed_roles) = 0 OR kd.allowed_roles && ARRAY[${Prisma.join(roles)}]::text[]`
    : Prisma.sql`cardinality(kd.allowed_roles) = 0`;
  return prisma.$queryRaw<RetrievedKnowledge[]>(Prisma.sql`
    SELECT kc.id AS "chunkId", kd.id AS "documentId", kd.title,
           kc.content, (kc.embedding <=> ${vectorLiteral}::vector) AS distance
    FROM knowledge_chunks kc
    INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
    WHERE kd.status = 'INDEXED'
      AND (${roleFilter})
      AND (
        kd.visibility = 'PUBLIC'
        OR (kd.visibility = 'CUSTOMER' AND ${roles.includes("CUSTOMER")})
        OR (kd.visibility = 'STAFF' AND ${roles.some((role) => ["INSTRUCTOR", "ADMIN", "SUPERADMIN"].includes(role))})
        OR (kd.visibility = 'ADMIN' AND ${roles.some((role) => ["ADMIN", "SUPERADMIN"].includes(role))})
      )
    ORDER BY kc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `);
}
