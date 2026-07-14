import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { contentQueue, type ProcessContentJobData } from '../services/queue.service.js';
import { storageService } from '../services/storage.service.js';
import { extractPdfText } from '../services/pdf.service.js';
import { extractYoutubeTranscript } from '../services/youtube.service.js';
import { chunkText, storeChunksWithEmbeddings } from '../services/rag.service.js';
import { generateContentSections } from '../services/section.service.js';
import { assertQuota } from '../services/subscription.service.js';
import { autoGenerateSectionDecks } from '../services/slides.service.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';

export function registerProcessContentJob(): void {
  contentQueue.process(async (job) => {
    const { contentId } = job.data as ProcessContentJobData;

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    await prisma.content.update({
      where: { id: contentId },
      data: { status: ContentStatus.PROCESSING },
    });

    try {
      const usage = { userId: content.userId, metadata: { contentId } };
      let text = '';

      if (content.type === 'YOUTUBE' && content.url) {
        const transcript = await extractYoutubeTranscript(content.url, {
          title: content.title,
          locale: env.DEFAULT_CONTENT_LOCALE,
          usage,
        });
        text = transcript.text;
        await prisma.$transaction([
          prisma.contentTranscriptSegment.deleteMany({ where: { contentId } }),
          prisma.contentTranscriptSegment.createMany({
            data: transcript.segments.map((segment) => ({
              contentId,
              order: segment.order,
              startMs: segment.startMs,
              endMs: segment.endMs,
              text: segment.text,
              source: segment.source,
            })),
          }),
        ]);
      } else if (content.storagePath) {
        const buffer = await storageService.get(content.storagePath);
        if (content.type === 'PDF' || content.type === 'SLIDE') {
          text = await extractPdfText(buffer, content.title, usage);
        } else {
          throw new Error(`Unsupported content type: ${content.type}`);
        }
      } else {
        throw new Error('No content source available for processing');
      }

      const chunks = await chunkText(text);
      await storeChunksWithEmbeddings(contentId, chunks, usage);

      if (chunks.length > 3) {
        const user = await prisma.user.findUnique({
          where: { id: content.userId },
          select: { role: true },
        });
        await assertQuota(content.userId, 'GENERATION', { role: user?.role });
      }

      await generateContentSections(contentId, chunks.length);
      // Sections were regenerated with fresh ids — drop stale slide decks (incl. any
      // placeholder from a prior failed read) so they regenerate from the new text.
      await prisma.contentSlideDeck.deleteMany({ where: { contentId } });

      await prisma.content.update({
        where: { id: contentId },
        data: { status: ContentStatus.READY },
      });
      // Push to everyone who can see this content (owner + assigned learners) so their
      // tabs stop polling and refetch (content + sections + slides + summary) immediately.
      void publishContentEvent(contentId, { type: 'content.status', contentId, status: 'READY' });

      // Pre-generate section slide decks so students see ready slides immediately.
      // Best-effort and quota-aware — never fails an already-READY content.
      try {
        const owner = await prisma.user.findUnique({
          where: { id: content.userId },
          select: { role: true },
        });
        if (owner) {
          await autoGenerateSectionDecks({
            contentId,
            userId: content.userId,
            tenantId: content.tenantId,
            role: owner.role,
            title: content.title,
            locale: env.DEFAULT_CONTENT_LOCALE,
          });
        }
      } catch (slideErr) {
        console.warn(`Auto slide generation failed for content ${contentId}:`, slideErr);
      }
    } catch (error) {
      // updateMany (not update) so a content deleted mid-ingest — e.g. the user
      // deleted a still-processing material — doesn't throw P2025 here and mask
      // the real error.
      await prisma.content.updateMany({
        where: { id: contentId },
        data: { status: ContentStatus.FAILED },
      });
      void publishContentEvent(contentId, { type: 'content.status', contentId, status: 'FAILED' });
      throw error;
    }
  });

  contentQueue.on('failed', (job, err) => {
    console.error(`Content job ${job?.id} failed:`, err.message);
  });
}
