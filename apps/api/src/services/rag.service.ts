import { randomUUID } from 'crypto';
import { encode, decode } from 'gpt-tokenizer';
import type { AppLocale } from '@talim/types';
import { env } from '../config/env.js';
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

const RERANK_CANDIDATES = 20;

/**
 * Rerank candidates with Cohere Rerank when COHERE_API_KEY is set; otherwise keep
 * the RRF order. Never throws — degrades to the top-`limit` candidates on any error.
 */
async function rerank(
  query: string,
  rows: { text: string; chunkIndex: number }[],
  limit: number,
): Promise<{ text: string; chunkIndex: number }[]> {
  if (!env.COHERE_API_KEY || rows.length <= 1) return rows.slice(0, limit);
  try {
    const res = await fetch('https://api.cohere.com/v2/rerank', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'rerank-v3.5',
        query,
        documents: rows.map((r) => r.text),
        top_n: limit,
      }),
    });
    if (!res.ok) return rows.slice(0, limit);
    const data = (await res.json()) as { results?: { index: number }[] };
    const ordered = (data.results ?? [])
      .map((r) => rows[r.index])
      .filter((r): r is { text: string; chunkIndex: number } => Boolean(r));
    return ordered.length ? ordered.slice(0, limit) : rows.slice(0, limit);
  } catch {
    return rows.slice(0, limit);
  }
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
  const candidateCount = Math.max(limit, RERANK_CANDIDATES);

  // Hybrid retrieval: dense (cosine) + lexical (tsvector) fused with Reciprocal
  // Rank Fusion (k=60). Lexical recall catches exact terms/names/numbers that dense
  // search misses — important for low-resource Uzbek where dense recall is weaker.
  const rows = await prisma.$queryRawUnsafe<{ text: string; chunkIndex: number }[]>(
    `WITH vec AS (
       SELECT "id", "text", "chunkIndex",
              ROW_NUMBER() OVER (ORDER BY "embedding" <=> $2::vector) AS rnk
       FROM "Chunk"
       WHERE "contentId" = $1 AND "embedding" IS NOT NULL
       ORDER BY "embedding" <=> $2::vector
       LIMIT 40
     ),
     lex AS (
       SELECT "id", "text", "chunkIndex",
              ROW_NUMBER() OVER (ORDER BY ts_rank("tsv", q) DESC) AS rnk
       FROM "Chunk", websearch_to_tsquery('simple', $3) q
       WHERE "contentId" = $1 AND "tsv" @@ q
       LIMIT 40
     )
     SELECT f."text", f."chunkIndex"
     FROM (
       SELECT "id", "text", "chunkIndex", SUM(1.0 / (60 + rnk)) AS score
       FROM (SELECT * FROM vec UNION ALL SELECT * FROM lex) u
       GROUP BY "id", "text", "chunkIndex"
     ) f
     ORDER BY f.score DESC
     LIMIT $4`,
    contentId,
    vectorSql,
    query,
    candidateCount,
  );

  return rerank(query, rows, limit);
}

/** Retrieve the most relevant captioned figures for a query (vector similarity). */
export async function searchSimilarFigures(
  contentId: string,
  query: string,
  limit = 3,
  usage?: UsageContext,
): Promise<{ caption: string; page: number | null }[]> {
  const queryEmbedding = await generateEmbedding(
    query,
    usage ? { ...usage, metadata: { ...usage.metadata, contentId, figures: true } } : undefined,
  );
  const vectorSql = embeddingToSql(queryEmbedding);
  return prisma.$queryRawUnsafe<{ caption: string; page: number | null }[]>(
    `SELECT "caption", "page"
     FROM "ContentFigure"
     WHERE "contentId" = $1 AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $2::vector
     LIMIT $3`,
    contentId,
    vectorSql,
    limit,
  );
}

const FIGURE_LABEL: Record<AppLocale, string> = { uz: 'Rasm', en: 'Figure', ru: 'Рисунок' };

/** Format retrieved figures as labeled lines for injection into the RAG context. */
export function buildFigureContext(
  figures: { caption: string; page: number | null }[],
  locale: AppLocale = 'uz',
): string {
  if (figures.length === 0) return '';
  const label = FIGURE_LABEL[locale];
  return figures
    .map((f) => `[${label}${f.page ? ` ${f.page}` : ''}] ${f.caption}`)
    .join('\n');
}

export function buildRagContext(chunks: { text: string }[], locale: AppLocale = 'uz'): string {
  const label = getRagChunkLabel(locale);
  return chunks.map((c, i) => `--- ${label} ${i + 1} ---\n${c.text}`).join('\n\n');
}

/** Bound a context string to a token budget (keeps whole-document context from
 *  overflowing the model while no longer silently truncating at a tiny char cap). */
export function boundContextByTokens(text: string, maxTokens: number): string {
  const tokens = encode(text);
  if (tokens.length <= maxTokens) return text;
  return decode(tokens.slice(0, maxTokens));
}

/** Chunks in document order — better for whole-document tasks than semantic search.
 *  Default raised to 200 so summaries/full decks see the whole material, not the
 *  first ~40 chunks (callers bound the final context by tokens). */
export async function getOrderedChunks(
  contentId: string,
  limit: number = 200,
): Promise<{ text: string; chunkIndex: number }[]> {
  return prisma.chunk.findMany({
    where: { contentId },
    orderBy: { chunkIndex: 'asc' },
    take: limit,
    select: { text: true, chunkIndex: true },
  });
}
