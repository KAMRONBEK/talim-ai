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

export async function generateEmbeddings(
  texts: string[],
  usage?: UsageContext,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(clampToTokenLimit),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  recordEmbedUsage(usage, response, { chunkCount: texts.length });
  return response.data.map((item) => item.embedding);
}

export function embeddingToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
