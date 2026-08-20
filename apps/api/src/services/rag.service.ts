import { randomUUID } from 'crypto';
import { encode, decode } from 'gpt-tokenizer';
import type { AppLocale } from '@talim/types';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { getRagChunkLabel } from '../lib/locale-prompts.js';
import { generateEmbedding, generateEmbeddings, embeddingToSql } from './embed.service.js';
import { scriptVariants } from '../lib/uzbek-translit.js';
import type { UsageContext } from './usage.service.js';

// Token-based, structure-aware chunking (replaces the old 512-*character* splitter,
// which produced ~120-token fragments). Chunks fall on paragraph/sentence boundaries
// and target ~600 tokens with a token-bounded overlap so retrieval keeps meaning intact.
const TARGET_TOKENS = 600;
const OVERLAP_TOKENS = 80;
const MAX_BLOCK_TOKENS = 900;
const TOP_K = 7;

// --- Vector recall tuning -------------------------------------------------
// The HNSW indexes are global (one index over every tenant's chunks) while every
// retrieval filters by "contentId". Postgres cannot push that filter into the HNSW
// graph scan, so it is applied *after* the scan emits its candidates: the index walks
// to the globally nearest `ef_search` rows, then most of them are discarded because
// they belong to other documents. With the pgvector default (ef_search = 40) and a
// dense arm that asked for 40 rows there was zero slack — the longer the corpus, the
// fewer of those 40 survived the filter, which is exactly why recall collapsed on
// long PDFs. Raising ef_search widens the pool; iterative scan (pgvector 0.8+) makes
// the scan *refill* when the filter empties it, which is the real fix.
const HNSW_EF_SEARCH = 200;
const DENSE_CANDIDATES = 60;
const LEXICAL_CANDIDATES = 60;

// Retrieval breadth must scale with document size: a top-K that suits a 3-page handout
// starves a 400-page textbook, since the answer is a smaller fraction of the material.
const TOP_K_MAX = 14;
const CHUNKS_PER_EXTRA_K = 120;

function scaleTopK(base: number, chunkCount: number): number {
  return Math.min(base + Math.floor(chunkCount / CHUNKS_PER_EXTRA_K), TOP_K_MAX);
}

/** pgvector 0.8.0 added iterative index scans; older servers reject the GUC outright
 *  (and a failed SET aborts the surrounding transaction), so probe the version once.
 *
 *  Memoize only a SUCCESSFUL probe. Caching a failure would be indistinguishable from
 *  "this server is pgvector < 0.8", and a single transient error at boot — when the
 *  pool is busiest and the first tutor message triggers the lazy probe — would disable
 *  iterative scan for the whole process lifetime with nothing in the logs. */
let iterativeScanSupport: boolean | null = null;
let iterativeScanProbe: Promise<boolean> | null = null;

async function supportsIterativeScan(): Promise<boolean> {
  if (iterativeScanSupport !== null) return iterativeScanSupport;
  iterativeScanProbe ??= prisma
    .$queryRaw<{ extversion: string }[]>`SELECT extversion FROM pg_extension WHERE extname = 'vector'`
    .then((rows) => {
      const [major = 0, minor = 0] = (rows[0]?.extversion ?? '0.0').split('.').map(Number);
      iterativeScanSupport = major > 0 || minor >= 8;
      return iterativeScanSupport;
    })
    .catch((error) => {
      // Leave the result uncached so the next retrieval re-probes.
      console.warn('[rag] pgvector capability probe failed; iterative scan off this call', error);
      return false;
    })
    .finally(() => {
      iterativeScanProbe = null;
    });
  return iterativeScanProbe;
}

// Prisma's interactive-transaction defaults (timeout 5s, maxWait 2s) are far too tight
// for this workload: the settings above deliberately make the scan work harder, and the
// single API process shares its pool with ten Bull processors. Left at the defaults a
// slow scan would abort with P2028, and a busy pool would fail to even start the
// transaction after 2s — turning a previously-queuing read into a hard tutor error.
const VECTOR_TX_TIMEOUT_MS = 30_000;
const VECTOR_TX_MAX_WAIT_MS = 15_000;
// Re-indexing a book-length PDF inserts thousands of rows one statement at a time and
// runs on a background job, not a request — it needs a far longer ceiling than a read.
const CHUNK_WRITE_TIMEOUT_MS = 600_000;

/** Apply the per-query vector-recall settings, then run `run` on the same connection.
 *  `SET LOCAL` is transaction-scoped, so this must be an interactive transaction —
 *  a bare $executeRaw would land on an arbitrary pooled connection and be lost.
 *  Falls back to an unwrapped query if the transaction cannot be started or completed,
 *  so degraded recall never becomes a failed answer. */
async function withVectorRecall<T>(run: (client: typeof prisma) => Promise<T>): Promise<T> {
  const iterative = await supportsIterativeScan();
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Interpolated, not parameterised: SET LOCAL does not accept bind parameters.
        // Both values are module constants — no user input reaches this string.
        await tx.$executeRawUnsafe(`SET LOCAL hnsw.ef_search = ${HNSW_EF_SEARCH}`);
        if (iterative) {
          await tx.$executeRawUnsafe(`SET LOCAL hnsw.iterative_scan = 'relaxed_order'`);
        }
        return run(tx as unknown as typeof prisma);
      },
      { timeout: VECTOR_TX_TIMEOUT_MS, maxWait: VECTOR_TX_MAX_WAIT_MS },
    );
  } catch (error) {
    console.warn('[rag] vector-recall transaction failed; retrying without tuning', error);
    return run(prisma);
  }
}

function countTokens(text: string): number {
  return encode(text).length;
}

/** Tail of `text` bounded to ~`maxTokens`, decoded back to clean text (for overlap). */
function tokenTail(text: string, maxTokens: number): string {
  const tokens = encode(text);
  if (tokens.length <= maxTokens) return text;
  return decode(tokens.slice(tokens.length - maxTokens)).trimStart();
}

/** Hard-split text into token windows of at most `maxTokens` (no natural boundary needed). */
function splitByTokens(text: string, maxTokens: number): string[] {
  const tokens = encode(text);
  if (tokens.length <= maxTokens) return [text];
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i += maxTokens) {
    const part = decode(tokens.slice(i, i + maxTokens)).trim();
    if (part) out.push(part);
  }
  return out;
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
      .split(/(?<=[.!?…。؟])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    let buf = '';
    for (const sentence of sentences) {
      // A single "sentence" can exceed the cap when text lacks sentence punctuation
      // (e.g. Arabic/Cyrillic OCR), so hard-split by tokens — guaranteeing no block
      // (and thus no embedding input) is ever oversized.
      for (const part of splitByTokens(sentence, MAX_BLOCK_TOKENS)) {
        const candidate = buf ? `${buf} ${part}` : part;
        if (buf && countTokens(candidate) > MAX_BLOCK_TOKENS) {
          blocks.push(buf);
          buf = part;
        } else {
          buf = candidate;
        }
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
  // Embed BEFORE deleting. The old order wiped a working index first and only then
  // called the network, so any embedding failure (a 429 mid-way through a long PDF —
  // now more likely, since long inputs are split across several requests) left the
  // material with zero chunks and no retry: the tutor answered from empty context.
  const embeddings = await generateEmbeddings(
    chunks,
    usage ? { ...usage, metadata: { ...usage.metadata, contentId } } : undefined,
  );

  const rows = chunks.map((chunk, i) => ({ chunk, embedding: embeddings[i], index: i }));
  for (const row of rows) {
    // generateEmbeddings now guarantees a 1:1 result, so a gap is a real bug. Fail
    // before touching the existing index rather than leaving a silent hole in it.
    if (row.chunk && !row.embedding) {
      throw new Error(`Missing embedding for chunk ${row.index} of content ${contentId}`);
    }
  }

  // Swap atomically so a mid-write failure cannot leave the material partially indexed.
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`DELETE FROM "Chunk" WHERE "contentId" = ${contentId}`;
      for (const row of rows) {
        if (!row.chunk || !row.embedding) continue;
        await tx.$executeRawUnsafe(
          `INSERT INTO "Chunk" ("id", "contentId", "text", "embedding", "chunkIndex")
           VALUES ($1, $2, $3, $4::vector, $5)`,
          randomUUID(),
          contentId,
          row.chunk,
          embeddingToSql(row.embedding),
          row.index,
        );
      }
    },
    { timeout: CHUNK_WRITE_TIMEOUT_MS, maxWait: VECTOR_TX_MAX_WAIT_MS },
  );
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
    if (!res.ok) {
      // Degrading to RRF order is correct, but doing it *silently* meant a revoked or
      // rate-limited key looked identical to a healthy reranker for weeks. Log it.
      console.warn(`[rag] Cohere rerank failed (${res.status}); falling back to RRF order`);
      return rows.slice(0, limit);
    }
    const data = (await res.json()) as { results?: { index: number }[] };
    const ordered = (data.results ?? [])
      .map((r) => rows[r.index])
      .filter((r): r is { text: string; chunkIndex: number } => Boolean(r));
    if (!ordered.length) {
      console.warn('[rag] Cohere rerank returned no usable results; falling back to RRF order');
      return rows.slice(0, limit);
    }
    return ordered.slice(0, limit);
  } catch (error) {
    console.warn('[rag] Cohere rerank threw; falling back to RRF order', error);
    return rows.slice(0, limit);
  }
}

export async function searchSimilarChunks(
  contentId: string,
  query: string,
  limit: number = TOP_K,
  usage?: UsageContext,
): Promise<{ text: string; chunkIndex: number }[]> {
  // Bridge the Latin↔Cyrillic Uzbek script gap: materials are often Cyrillic while
  // learners type Latin (and vice versa). Embed both scripts together so dense recall
  // reaches cross-script chunks, and OR both tsqueries so the lexical arm matches a
  // Cyrillic chunk for a Latin query — otherwise "shin" never finds "шин".
  const variants = scriptVariants(query);
  const denseQuery = variants.join(' ') || query;
  const lexAlt = variants[1] ?? variants[0] ?? query;
  // The chunk count decides retrieval breadth; fetch it alongside the embedding so the
  // extra (index-only) count costs no wall-clock on top of the embedding round trip.
  const [queryEmbedding, chunkCount] = await Promise.all([
    generateEmbedding(
      denseQuery,
      usage ? { ...usage, metadata: { ...usage.metadata, contentId } } : undefined,
    ),
    prisma.chunk.count({ where: { contentId } }),
  ]);
  const vectorSql = embeddingToSql(queryEmbedding);
  const topK = scaleTopK(limit, chunkCount);
  const candidateCount = Math.max(topK * 3, RERANK_CANDIDATES);

  // Hybrid retrieval: dense (cosine) + lexical (tsvector) fused with Reciprocal
  // Rank Fusion (k=60). Lexical recall catches exact terms/names/numbers that dense
  // search misses — important for low-resource Uzbek where dense recall is weaker.
  const rows = await withVectorRecall((tx) =>
    tx.$queryRawUnsafe<{ text: string; chunkIndex: number }[]>(
      `WITH vec AS (
       SELECT "id", "text", "chunkIndex",
              ROW_NUMBER() OVER (ORDER BY "embedding" <=> $2::vector) AS rnk
       FROM "Chunk"
       WHERE "contentId" = $1 AND "embedding" IS NOT NULL
       ORDER BY "embedding" <=> $2::vector
       LIMIT $6
     ),
     lex AS (
       SELECT "id", "text", "chunkIndex",
              ROW_NUMBER() OVER (ORDER BY ts_rank("tsv", qq.q) DESC) AS rnk
       FROM "Chunk"
       CROSS JOIN (
         SELECT websearch_to_tsquery('simple', $3) || websearch_to_tsquery('simple', $5) AS q
       ) qq
       WHERE "contentId" = $1 AND "tsv" @@ qq.q
       LIMIT $7
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
      lexAlt,
      DENSE_CANDIDATES,
      LEXICAL_CANDIDATES,
    ),
  );

  return rerank(query, rows, topK);
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
  // Same global-HNSW + contentId post-filter shape as searchSimilarChunks — needs the
  // same recall settings, or a figure-rich corpus starves this query too.
  return withVectorRecall((tx) =>
    tx.$queryRawUnsafe<{ caption: string; page: number | null }[]>(
      `SELECT "caption", "page"
     FROM "ContentFigure"
     WHERE "contentId" = $1 AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $2::vector
     LIMIT $3`,
      contentId,
      vectorSql,
      limit,
    ),
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
