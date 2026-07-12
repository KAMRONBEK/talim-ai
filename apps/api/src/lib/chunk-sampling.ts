import { prisma } from './prisma.js';

/**
 * Shared chunk sampling for question generation (B2C practice job + tenant banks).
 *
 * Below this many characters of section text there is nothing to ground questions in —
 * the model pads from its own knowledge and the sourceQuote firewall then rejects every
 * item (observed live: a heading-only 42-char section failed 9/9). Such sections widen
 * their context to the whole material instead.
 */
export const MIN_SECTION_CONTEXT_CHARS = 500;

export interface SampledChunk {
  text: string;
  chunkIndex: number;
}

/**
 * Even (stratified, midpoint) spread of up to `target` chunks across the whole material.
 * chunkIndex is a dense 0..n-1 series per content, so the spread is computed from a count
 * and fetched with a targeted IN query — never loading the full document's text just to
 * discard most of it (a 1,500-chunk book would otherwise pull megabytes per generation).
 * Midpoint sampling (`(i + 0.5) * step`) keeps the document's start AND end represented.
 */
export async function sampleChunksEvenly(
  contentId: string,
  target: number,
): Promise<SampledChunk[]> {
  const total = await prisma.chunk.count({ where: { contentId } });
  if (total === 0) return [];
  const take = Math.min(target, total);
  const step = total / take;
  const indices = [
    ...new Set(Array.from({ length: take }, (_, i) => Math.min(total - 1, Math.floor((i + 0.5) * step)))),
  ];
  return prisma.chunk.findMany({
    where: { contentId, chunkIndex: { in: indices } },
    orderBy: { chunkIndex: 'asc' },
    select: { text: true, chunkIndex: true },
  });
}
