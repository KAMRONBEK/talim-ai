import { prisma } from '../lib/prisma.js';
import { generateChatCompletion } from '../services/ai.service.js';
import { buildRagContext } from '../services/rag.service.js';
import { podcastQueue, type GeneratePodcastJobData } from '../services/queue.service.js';
import { synthesizeSpeech } from '../services/tts.service.js';
import { storageService } from '../services/storage.service.js';

export function registerGeneratePodcastJob(): void {
  podcastQueue.process(async (job) => {
    const { contentId, podcastId } = job.data as GeneratePodcastJobData;

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!content) throw new Error(`Content ${contentId} not found`);

    await prisma.podcastEpisode.deleteMany({ where: { podcastId } });

    let sections = content.sections;
    if (sections.length === 0) {
      const maxChunk = await prisma.chunk.aggregate({
        where: { contentId },
        _max: { chunkIndex: true },
      });
      const endChunk = maxChunk._max.chunkIndex ?? 0;
      sections = [
        {
          id: 'full',
          contentId,
          title: content.title,
          order: 0,
          startChunk: 0,
          endChunk,
          readMinutes: 10,
        },
      ];
    }

    let audioCount = 0;

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec) continue;

      const chunks = await prisma.chunk.findMany({
        where: {
          contentId,
          chunkIndex: { gte: sec.startChunk, lte: sec.endChunk },
        },
        orderBy: { chunkIndex: 'asc' },
        take: 15,
      });

      const context =
        chunks.length > 0
          ? buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex })))
          : '';

      const script = await generateChatCompletion([
        {
          role: 'system',
          content:
            'Write a clear, engaging podcast script (3-4 minutes when spoken) for a student learning this material. No stage directions, just spoken narration.',
        },
        {
          role: 'user',
          content: `Topic: ${sec.title}\n\nMaterial:\n${context || content.title}\n\nWrite the script.`,
        },
      ]);

      const episode = await prisma.podcastEpisode.create({
        data: {
          podcastId,
          title: sec.title,
          order: i,
          script,
          sectionId: sec.id === 'full' ? null : sec.id,
        },
      });

      try {
        const audio = await synthesizeSpeech(script);
        const audioPath = await storageService.save(audio, `${episode.id}.mp3`);
        const wordCount = script.split(/\s+/).length;
        await prisma.podcastEpisode.update({
          where: { id: episode.id },
          data: {
            audioPath,
            durationSec: Math.max(60, Math.round((wordCount / 150) * 60)),
          },
        });
        audioCount++;
      } catch (err) {
        console.error(`TTS failed for episode ${episode.id}:`, err);
      }
    }

    await prisma.podcast.update({
      where: { id: podcastId },
      data: { status: audioCount > 0 ? 'READY' : 'FAILED' },
    });
  });

  podcastQueue.on('failed', async (job, err) => {
    console.error(`Podcast job ${job?.id} failed:`, err.message);
    const data = job?.data as GeneratePodcastJobData | undefined;
    if (data?.podcastId) {
      await prisma.podcast.update({
        where: { id: data.podcastId },
        data: { status: 'FAILED' },
      });
    }
  });
}
