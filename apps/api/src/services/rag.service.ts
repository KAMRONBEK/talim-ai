import { randomUUID } from 'crypto';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { prisma } from '../lib/prisma.js';
import { generateEmbedding, generateEmbeddings, embeddingToSql } from './embed.service.js';

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;
const TOP_K = 5;

export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  return splitter.splitText(text);
}

export async function storeChunksWithEmbeddings(contentId: string, chunks: string[]): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "Chunk" WHERE "contentId" = ${contentId}`;

  const embeddings = await generateEmbeddings(chunks);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];
    if (!chunk || !embedding) continue;

    const vectorSql = embeddingToSql(embedding);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Chunk" ("id", "contentId", "text", "embedding", "chunkIndex")
       VALUES ($1, $2, $3, $4::vector, $5)`,
      randomUUID(),
      contentId,
      chunk,
      vectorSql,
      i,
    );
  }
}

export async function searchSimilarChunks(
  contentId: string,
  query: string,
  limit: number = TOP_K,
): Promise<{ text: string; chunkIndex: number }[]> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorSql = embeddingToSql(queryEmbedding);

  const results = await prisma.$queryRawUnsafe<
    { text: string; chunkIndex: number }[]
  >(
    `SELECT "text", "chunkIndex"
     FROM "Chunk"
     WHERE "contentId" = $1 AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $2::vector
     LIMIT $3`,
    contentId,
    vectorSql,
    limit,
  );

  return results;
}

export function buildRagContext(chunks: { text: string }[]): string {
  return chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');
}

/** Chunks in document order — better for summaries than semantic search alone. */
export async function getOrderedChunks(
  contentId: string,
  limit: number = 40,
): Promise<{ text: string; chunkIndex: number }[]> {
  return prisma.chunk.findMany({
    where: { contentId },
    orderBy: { chunkIndex: 'asc' },
    take: limit,
    select: { text: true, chunkIndex: true },
  });
}
