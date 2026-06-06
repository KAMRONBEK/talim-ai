import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { contentQueue, type ProcessContentJobData } from '../services/queue.service.js';
import { storageService } from '../services/storage.service.js';
import { extractPdfText } from '../services/pdf.service.js';
import { extractYoutubeTranscript } from '../services/youtube.service.js';
import { chunkText, storeChunksWithEmbeddings } from '../services/rag.service.js';
import { generateContentSections } from '../services/section.service.js';

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
      let text = '';

      if (content.type === 'YOUTUBE' && content.url) {
        const transcript = await extractYoutubeTranscript(content.url, {
          title: content.title,
          locale: env.DEFAULT_CONTENT_LOCALE,
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
          text = await extractPdfText(buffer, content.title);
        } else {
          throw new Error(`Unsupported content type: ${content.type}`);
        }
      } else {
        throw new Error('No content source available for processing');
      }

      const chunks = await chunkText(text);
      await storeChunksWithEmbeddings(contentId, chunks);
      await generateContentSections(contentId, chunks.length);

      await prisma.content.update({
        where: { id: contentId },
        data: { status: ContentStatus.READY },
      });
    } catch (error) {
      await prisma.content.update({
        where: { id: contentId },
        data: { status: ContentStatus.FAILED },
      });
      throw error;
    }
  });

  contentQueue.on('failed', (job, err) => {
    console.error(`Content job ${job?.id} failed:`, err.message);
  });
}
