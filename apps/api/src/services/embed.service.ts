import OpenAI from 'openai';
import type { UsageFeature } from '@prisma/client';
import { env } from '../config/env.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

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
    input: text,
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
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  recordEmbedUsage(usage, response, { chunkCount: texts.length });
  return response.data.map((item) => item.embedding);
}

export function embeddingToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
