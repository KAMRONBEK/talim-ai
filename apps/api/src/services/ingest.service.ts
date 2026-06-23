import { prisma } from '../lib/prisma.js';
import { chunkText, storeChunksWithEmbeddings } from './rag.service.js';
import { generateContentSections } from './section.service.js';
import type { UsageContext } from './usage.service.js';

/**
 * Turn already-extracted text into the searchable knowledge for a content:
 * chunk → embed (replaces existing chunks) → regenerate sections. The caller
 * owns the content status transitions.
 */
export async function ingestText(
  contentId: string,
  text: string,
  usage?: UsageContext,
): Promise<{ chunkCount: number }> {
  const chunks = await chunkText(text);
  await storeChunksWithEmbeddings(contentId, chunks, usage);
  await generateContentSections(contentId, chunks.length);
  // Sections are regenerated with fresh ids, so previously generated slide decks
  // (keyed by section) are stale — drop them so they regenerate from the new text.
  await prisma.contentSlideDeck.deleteMany({ where: { contentId } });
  return { chunkCount: chunks.length };
}
