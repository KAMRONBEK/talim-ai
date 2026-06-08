import { randomUUID } from 'crypto';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { AppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { getRagChunkLabel } from '../lib/locale-prompts.js';
import { generateEmbedding, generateEmbeddings, embeddingToSql } from './embed.service.js';
import type { UsageContext } from './usage.service.js';

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;
const TOP_K = 7;

export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  return splitter.splitText(text);
}

export async function storeChunksWithEmbeddings(
  contentId: string,
  chunks: string[],
  usage?: UsageContext,
): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "Chunk" WHERE "contentId" = ${contentId}`;

  const embeddings = await generateEmbeddings(chunks, usage ? { ...usage, metadata: { ...usage.metadata, contentId } } : undefined);

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

export function mergeSimilarChunks(
  primary: { text: string; chunkIndex: number }[],
  secondary: { text: string; chunkIndex: number }[],
  limit: number = TOP_K,
): { text: string; chunkIndex: number }[] {
  const seen = new Set<number>();
  const merged: { text: string; chunkIndex: number }[] = [];

  for (const chunk of [...primary, ...secondary]) {
    if (seen.has(chunk.chunkIndex)) continue;
    seen.add(chunk.chunkIndex);
    merged.push(chunk);
    if (merged.length >= limit) break;
  }

  return merged;
}

export async function searchSimilarChunks(
  contentId: string,
  query: string,
  limit: number = TOP_K,
  usage?: UsageContext,
): Promise<{ text: string; chunkIndex: number }[]> {
  const queryEmbedding = await generateEmbedding(
    query,
    usage ? { ...usage, metadata: { ...usage.metadata, contentId } } : undefined,
  );
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

export function buildRagContext(chunks: { text: string }[], locale: AppLocale = 'uz'): string {
  const label = getRagChunkLabel(locale);
  return chunks.map((c, i) => `--- ${label} ${i + 1} ---\n${c.text}`).join('\n\n');
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
