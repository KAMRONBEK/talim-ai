import OpenAI from 'openai';
import { encode, decode } from 'gpt-tokenizer';
import type { UsageFeature } from '@prisma/client';
import { env } from '../config/env.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
// text-embedding-3-small rejects inputs over 8192 tokens, and one bad input fails
// the whole batch. Clamp defensively so a single overlong chunk can't kill ingest.
const EMBED_MAX_TOKENS = 8000;

function clampToTokenLimit(text: string): string {
  const tokens = encode(text);
  return tokens.length <= EMBED_MAX_TOKENS ? text : decode(tokens.slice(0, EMBED_MAX_TOKENS));
}

function recordEmbedUsage(
  usage: UsageContext | undefined,
  response: { usage?: { prompt_tokens?: number; total_tokens?: number } | null },
  metadata?: Record<string, unknown>,
): void {
  if (!usage) return;
  recordUsage({
    userId: usage.userId,
    tenantId: usage.tenantId,
    feature: 'EMBED' satisfies UsageFeature,
    model: EMBEDDING_MODEL,
    inputTokens: response.usage?.prompt_tokens ?? response.usage?.total_tokens ?? 0,
    outputTokens: 0,
    metadata: { ...usage.metadata, ...metadata },
  });
}

export async function generateEmbedding(
  text: string,
  usage?: UsageContext,
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: clampToTokenLimit(text),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) {
    throw new Error('Failed to generate embedding');
  }
  recordEmbedUsage(usage, response);
  return embedding;
}

// The embeddings endpoint caps a single request at 2048 inputs and ~300k tokens. A
// book-length PDF exceeds both, and the whole request 400s — long documents failed to
// ingest outright. Batch well under each cap so document length stops being a limit.
const EMBED_MAX_BATCH_INPUTS = 256;
const EMBED_MAX_BATCH_TOKENS = 200_000;

function batchByTokenBudget(texts: string[]): string[][] {
  const batches: string[][] = [];
  let batch: string[] = [];
  let batchTokens = 0;

  for (const text of texts) {
    const tokens = Math.min(encode(text).length, EMBED_MAX_TOKENS);
    const wouldExceed =
      batch.length >= EMBED_MAX_BATCH_INPUTS || batchTokens + tokens > EMBED_MAX_BATCH_TOKENS;
    if (batch.length > 0 && wouldExceed) {
      batches.push(batch);
      batch = [];
      batchTokens = 0;
    }
    batch.push(text);
    batchTokens += tokens;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

export async function generateEmbeddings(
  texts: string[],
  usage?: UsageContext,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];
  for (const batch of batchByTokenBudget(texts)) {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map(clampToTokenLimit),
      dimensions: EMBEDDING_DIMENSIONS,
    });
    recordEmbedUsage(usage, response, { chunkCount: batch.length });

    // Align by the response's own `index` rather than array position: the API does not
    // guarantee ordering, and a positional map would silently mis-pair every embedding
    // after a reordered element — invisible corruption of the whole vector index.
    const ordered: number[][] = new Array(batch.length);
    for (const item of response.data) {
      ordered[item.index] = item.embedding;
    }
    const missing = ordered.findIndex((e) => !e);
    if (missing !== -1) {
      throw new Error(
        `Embedding response incomplete: expected ${batch.length} vectors, missing index ${missing}`,
      );
    }
    embeddings.push(...ordered);
  }

  return embeddings;
}

export function embeddingToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
