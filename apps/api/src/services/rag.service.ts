import { randomUUID } from 'crypto';
import { encode, decode } from 'gpt-tokenizer';
import type { AppLocale } from '@talim/types';
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

// Weighted RRF. The raw query the learner actually typed votes at full strength; its
// transliterations vote lower because the transliterator is letter-wise and mangles
// non-Uzbek tokens, so a variant arm is a cross-script bridge rather than an equal
// opinion. At most three dense arms — scriptVariants returns [raw, cyrillic, latin]
// for mixed-script input and [raw, other-script] otherwise.
const PRIMARY_ARM_WEIGHT = 1.0;
const VARIANT_ARM_WEIGHT = 0.6;
const LEXICAL_ARM_WEIGHT = 1.0;
const MAX_DENSE_ARMS = 3;

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

export async function searchSimilarChunks(
  contentId: string,
  query: string,
  limit: number = TOP_K,
  usage?: UsageContext,
  options?: { contextualQuery?: string },
): Promise<{ text: string; chunkIndex: number }[]> {
  // Bridge the Latin↔Cyrillic Uzbek script gap: materials are often Cyrillic while
  // learners type Latin (and vice versa), so the lexical arm ORs a tsquery per script
  // variant and "shin" can still find "шин".
  //
  // Dense side: each script variant gets its OWN embedding and its OWN fusion arm.
  // Concatenating them into one string (the previous behaviour) produced a single
  // blended vector sitting between the Latin and Cyrillic clusters, matching neither
  // cleanly — the biggest dense-recall defect for this corpus. Indexing variants
  // positionally would be wrong too: variants[0] is the RAW query (still mixed-script
  // for inputs like "DNK ва РНК farqi"), so we simply use them all.
  //
  // Dense and lexical deliberately search DIFFERENT strings. `contextualQuery` may
  // carry prior conversation so a bare follow-up still embeds its subject — useful for
  // vectors, fatal for keywords: websearch_to_tsquery ANDs plain terms, so a 44-term
  // expanded query matches no chunk at all and silently zeroes the lexical arm. The
  // lexical side therefore always searches the learner's actual message.
  const denseSource = options?.contextualQuery?.trim() || query;
  const denseVariants = scriptVariants(denseSource).slice(0, MAX_DENSE_ARMS);
  const denseQueries = denseVariants.length ? denseVariants : [denseSource];
  const lexicalVariants = scriptVariants(query).slice(0, MAX_DENSE_ARMS);
  const lexicalQueries = lexicalVariants.length ? lexicalVariants : [query];
  // The chunk count decides retrieval breadth; fetch it alongside the embeddings so the
  // extra (index-only) count costs no wall-clock on top of the embedding round trip.
  // All variants embed in ONE request — batching is already handled in embed.service.
  const [queryEmbeddings, chunkCount] = await Promise.all([
    generateEmbeddings(
      denseQueries,
      usage ? { ...usage, metadata: { ...usage.metadata, contentId } } : undefined,
    ),
    prisma.chunk.count({ where: { contentId } }),
  ]);
  const topK = scaleTopK(limit, chunkCount);

  // Hybrid retrieval: one dense (cosine) arm per script variant + one lexical
  // (tsvector) arm, fused with weighted Reciprocal Rank Fusion (k=60). Lexical recall
  // catches exact terms/names/numbers that dense search misses — important for
  // low-resource Uzbek where dense recall is weaker.
  //
  // Arms are weighted, not equal. Plain RRF gives every arm's rank-1 the same 1/61
  // regardless of how confident it is, and there is no similarity threshold — so a
  // transliteration that is garbage for non-Uzbek tokens ("photosynthesis" becomes
  // "пҳотосйнтҳесис") would still inject 60 candidates at full strength. Variant arms
  // therefore vote at reduced weight: they are a cross-script bridge, not an equal
  // opinion.
  //
  // Dense weights are then NORMALISED to sum to 1.0. Without this, adding arms would
  // inflate total dense mass (up to 1.0 + 0.6 + 0.6 = 2.2) against a fixed lexical 1.0,
  // and a chunk that only the lexical arm found — an exact name, year or figure that
  // dense recall misses, precisely what the lexical arm exists for — could be outscored
  // and evicted from topK. Normalising keeps dense-vs-lexical balance identical to the
  // single-arm behaviour while still letting a chunk confirmed across scripts outrank
  // one found by a single arm.
  const rawWeights = queryEmbeddings.map((_, i) => (i === 0 ? PRIMARY_ARM_WEIGHT : VARIANT_ARM_WEIGHT));
  const weightSum = rawWeights.reduce((a, b) => a + b, 0) || 1;

  // Params: $1 contentId · $2 topK · $3 dense limit · $4 lexical limit ·
  //         then one tsquery per lexical variant, then one vector per dense arm.
  const LEX_PARAM_OFFSET = 5;
  const vectorParamOffset = LEX_PARAM_OFFSET + lexicalQueries.length;
  const denseArms = queryEmbeddings.map((_, i) => {
    const p = vectorParamOffset + i;
    const weight = (rawWeights[i]! / weightSum).toFixed(6);
    return `vec${i} AS (
       SELECT "id", "text", "chunkIndex", ${weight}::float8 AS w,
              ROW_NUMBER() OVER (ORDER BY "embedding" <=> $${p}::vector) AS rnk
       FROM "Chunk"
       WHERE "contentId" = $1 AND "embedding" IS NOT NULL
       ORDER BY "embedding" <=> $${p}::vector
       LIMIT $3
     )`;
  });
  // OR a tsquery per script variant. Picking two positionally dropped the clean Latin
  // form for mixed-script input, leaving exact-term recall to arms that cannot provide it.
  const lexTsQuery = lexicalQueries
    .map((_, i) => `websearch_to_tsquery('simple', $${LEX_PARAM_OFFSET + i})`)
    .join(' || ');
  const armUnion = [...queryEmbeddings.map((_, i) => `SELECT * FROM vec${i}`), 'SELECT * FROM lex'].join(
    ' UNION ALL ',
  );

  const rows = await withVectorRecall((tx) =>
    tx.$queryRawUnsafe<{ text: string; chunkIndex: number }[]>(
      `WITH ${denseArms.join(',\n     ')},
     lex AS (
       SELECT "id", "text", "chunkIndex", ${LEXICAL_ARM_WEIGHT}::float8 AS w,
              ROW_NUMBER() OVER (ORDER BY ts_rank("tsv", qq.q) DESC) AS rnk
       FROM "Chunk"
       CROSS JOIN (SELECT ${lexTsQuery} AS q) qq
       WHERE "contentId" = $1 AND "tsv" @@ qq.q
       LIMIT $4
     )
     SELECT f."text", f."chunkIndex"
     FROM (
       SELECT "id", "text", "chunkIndex", SUM(w / (60 + rnk)) AS score
       FROM (${armUnion}) u
       GROUP BY "id", "text", "chunkIndex"
     ) f
     ORDER BY f.score DESC
     LIMIT $2`,
      contentId,
      topK,
      DENSE_CANDIDATES,
      LEXICAL_CANDIDATES,
      ...lexicalQueries,
      ...queryEmbeddings.map(embeddingToSql),
    ),
  );

  // RRF order is final, so the fused SELECT already returns exactly the chunks we want
  // — no second ranking pass to trim down to.
  return rows;
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
