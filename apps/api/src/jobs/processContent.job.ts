import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
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

      // The AI outline is the only thing left that the generation quota can still refuse — the
      // chunks and embeddings above are already computed, already paid for, and already stored.
      let allowAiOutline = true;
      if (chunks.length > 3) {
        const user = await prisma.user.findUnique({
          where: { id: content.userId },
          select: { role: true },
        });
        try {
          await assertQuota(content.userId, 'GENERATION', {
            role: user?.role,
            // Without this a TENANT_OWNER fell through to the personal path, where they have no
            // subscription row — so one was CREATED for them on the spot at FREE's 5/day, while
            // the upload that was just accepted had been checked against the org's 50/day. Every
            // tutor hit a hard cliff on their 6th ingest of the day, and the job quietly wrote a
            // phantom FREE subscription in their name. reparseContent has always passed it.
            tenantId: content.tenantId ?? undefined,
          });
        } catch (err: unknown) {
          // Match on the 402 status, not the QuotaExceededError class: an inactive org
          // subscription throws a plain AppError(402) from requireActiveTenantSubscription, and
          // that must not turn a paid-for ingest into a dead material either.
          if (!(err instanceof AppError) || err.statusCode !== 402) throw err;
          allowAiOutline = false;
        }
      }

      // Degrading rather than failing: the material reaches READY and the tutor, RAG, search and
      // quizzes all work — only the chapter titles are generic. Failing here threw away work the
      // user had already been charged for, and reported it as a scanned-PDF problem.
      await generateContentSections(contentId, chunks.length, { skipAiOutline: !allowAiOutline });
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
