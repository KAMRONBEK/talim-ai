import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { reparseQueue, type ReparseContentJobData } from '../services/queue.service.js';
import { storageService } from '../services/storage.service.js';
import { extractTextFromPageImages } from '../services/pdf.service.js';
import { ingestText } from '../services/ingest.service.js';
import { captionAndStoreFigures } from '../services/figure.service.js';
import { autoGenerateSectionDecks } from '../services/slides.service.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';

/**
 * "Re-read with OCR" as a background job. The controllers used to run vision OCR of
 * up to 30 client-rasterized page images + a full re-embed inline in the request
 * (1–4+ minutes; an API restart mid-request stranded the content in PROCESSING
 * forever). Now the controller stages the page images via storageService, flips the
 * content to PROCESSING, and enqueues {contentId, userId, pagesStorageKey}; this
 * processor does the OCR + re-ingest, flips READY/FAILED, and pushes content.status
 * over SSE so every viewer's tab refetches.
 */
export function registerReparseContentJob(): void {
  reparseQueue.process(async (job) => {
    const { contentId, userId, pagesStorageKey } = job.data as ReparseContentJobData;

    try {
      const content = await prisma.content.findUnique({ where: { id: contentId } });
      if (!content) throw new Error(`Content ${contentId} not found`);

      const usage = {
        userId: content.userId,
        tenantId: content.tenantId ?? undefined,
        metadata: { contentId, reparse: true },
      };
      const pages = JSON.parse(
        (await storageService.get(pagesStorageKey)).toString('utf8'),
      ) as string[];

      const text = await extractTextFromPageImages(pages, usage);
      await ingestText(contentId, text, usage);
      await prisma.content.update({
        where: { id: contentId },
        data: { status: ContentStatus.READY },
      });
      // Push to everyone who can see this content (owner + assigned learners) so
      // their tabs refetch (content + sections + slides + summary) immediately.
      void publishContentEvent(contentId, { type: 'content.status', contentId, status: 'READY' });

      // Caption + index the page figures (best-effort) so diagrams are retrievable.
      void captionAndStoreFigures(contentId, pages, usage).catch(() => {});

      // Pre-generate the new section decks in the background (best-effort). The
      // controller passed the requester's role inline; resolve it from the DB here.
      // Inner try/catch (mirrors processContent.job): nothing after the READY flip may
      // reach the outer catch and mark an already-successful re-ingest FAILED.
      try {
        const requester = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        if (requester) {
          void autoGenerateSectionDecks({
            contentId,
            userId: content.userId,
            tenantId: content.tenantId ?? null,
            role: requester.role,
            title: content.title,
            locale: env.DEFAULT_CONTENT_LOCALE,
          }).catch(() => {});
        }
      } catch (deckErr) {
        console.warn(`Auto slide generation skipped for reparsed content ${contentId}:`, deckErr);
      }
    } catch (error) {
      // updateMany (not update) so content deleted mid-reparse doesn't throw P2025
      // here and mask the real error.
      await prisma.content.updateMany({
        where: { id: contentId },
        data: { status: ContentStatus.FAILED },
      });
      void publishContentEvent(contentId, { type: 'content.status', contentId, status: 'FAILED' });
      throw error;
    } finally {
      // The staged page images are single-use — drop them whatever happened.
      await Promise.resolve(storageService.delete(pagesStorageKey)).catch(() => undefined);
    }
  });

  reparseQueue.on('failed', (job, err) => {
    console.error(`Reparse job ${job?.id} failed:`, err.message);
  });
}
