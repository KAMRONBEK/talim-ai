import { randomUUID } from 'crypto';
import { encode, decode } from 'gpt-tokenizer';
import type { AppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { getRagChunkLabel } from '../lib/locale-prompts.js';
import { generateEmbedding, generateEmbeddings, embeddingToSql } from './embed.service.js';
import type { UsageContext } from './usage.service.js';

// Token-based, structure-aware chunking (replaces the old 512-*character* splitter,
// which produced ~120-token fragments). Chunks fall on paragraph/sentence boundaries
// and target ~600 tokens with a token-bounded overlap so retrieval keeps meaning intact.
const TARGET_TOKENS = 600;
const OVERLAP_TOKENS = 80;
const MAX_BLOCK_TOKENS = 900;
const TOP_K = 7;

function countTokens(text: string): number {
  return encode(text).length;
}

/** Tail of `text` bounded to ~`maxTokens`, decoded back to clean text (for overlap). */
function tokenTail(text: string, maxTokens: number): string {
  const tokens = encode(text);
  if (tokens.length <= maxTokens) return text;
  return decode(tokens.slice(tokens.length - maxTokens)).trimStart();
}

/** Split into structural blocks (paragraphs), further splitting oversized ones by sentence. */
function toBlocks(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks: string[] = [];
  for (const para of paragraphs) {
    if (countTokens(para) <= MAX_BLOCK_TOKENS) {
      blocks.push(para);
      continue;
    }
    const sentences = para
      .split(/(?<=[.!?…。])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    let buf = '';
    for (const sentence of sentences) {
      const candidate = buf ? `${buf} ${sentence}` : sentence;
      if (buf && countTokens(candidate) > MAX_BLOCK_TOKENS) {
        blocks.push(buf);
        buf = sentence;
      } else {
        buf = candidate;
      }
    }
    if (buf) blocks.push(buf);
  }
  return blocks;
}

export async function chunkText(text: string): Promise<string[]> {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const blocks = toBlocks(clean);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const block of blocks) {
    const blockTokens = countTokens(block);
    if (current.length > 0 && currentTokens + blockTokens > TARGET_TOKENS) {
      const joined = current.join('\n\n');
      chunks.push(joined);
      // Seed the next chunk with a token-bounded overlap tail for continuity.
      const overlap = tokenTail(joined, OVERLAP_TOKENS);
      current = overlap ? [overlap] : [];
      currentTokens = overlap ? countTokens(overlap) : 0;
    }
    current.push(block);
    currentTokens += blockTokens;
  }
  if (current.length > 0) chunks.push(current.join('\n\n'));

  return chunks.map((c) => c.trim()).filter(Boolean);
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
