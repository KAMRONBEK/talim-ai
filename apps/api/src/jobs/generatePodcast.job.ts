import { parseAppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { generateChatCompletion } from '../services/ai.service.js';
import { buildRagContext, boundContextByTokens } from '../services/rag.service.js';
import { podcastQueue, type GeneratePodcastJobData } from '../services/queue.service.js';
import { synthesizeSpeech, synthesizeDialogue } from '../services/tts.service.js';
import { storageService } from '../services/storage.service.js';
import {
  getPodcastSystemPrompt,
  buildPodcastUserPrompt,
  parsePodcastDialogue,
} from '../lib/locale-prompts.js';

export function registerGeneratePodcastJob(): void {
  podcastQueue.process(async (job) => {
    const { contentId, podcastId, locale: jobLocale, episodeId } = job.data as GeneratePodcastJobData;

    const podcast = await prisma.podcast.findUnique({ where: { id: podcastId } });
    if (!podcast) throw new Error(`Podcast ${podcastId} not found`);

    const locale = parseAppLocale(jobLocale ?? podcast.locale);

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!content) throw new Error(`Content ${contentId} not found`);

    // Single-episode (manual per-section) regeneration: rebuild just this one
    // episode's script + audio and leave the other episodes intact.
    if (episodeId) {
      const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
      if (!episode || episode.podcastId !== podcastId) {
        throw new Error(`Episode ${episodeId} not found for podcast ${podcastId}`);
      }
      let section = content.sections.find((s) => s.id === episode.sectionId);
      if (!section) {
        const maxChunk = await prisma.chunk.aggregate({
          where: { contentId },
          _max: { chunkIndex: true },
        });
        section = {
          id: 'full',
          contentId,
          title: content.title,
          order: episode.order,
          startChunk: 0,
          endChunk: maxChunk._max.chunkIndex ?? 0,
          readMinutes: 10,
        };
      }
      const chunks = await prisma.chunk.findMany({
        where: { contentId, chunkIndex: { gte: section.startChunk, lte: section.endChunk } },
        orderBy: { chunkIndex: 'asc' },
      });
      const context =
        chunks.length > 0
          ? boundContextByTokens(
              buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex }))),
              8000,
            )
          : '';
      const script = await generateChatCompletion(
        [
          { role: 'system', content: getPodcastSystemPrompt(locale) },
          {
            role: 'user',
            content: buildPodcastUserPrompt(locale, section.title, context || content.title),
          },
        ],
        { userId: content.userId, feature: 'PODCAST_GEN', metadata: { contentId, podcastId } },
      );
      if (episode.audioPath) await storageService.delete(episode.audioPath).catch(() => undefined);
      await prisma.podcastEpisode.update({
        where: { id: episode.id },
        data: { script, audioPath: null, durationSec: null },
      });
      try {
        const ttsUsage = {
          userId: content.userId,
          metadata: { contentId, podcastId, episodeId: episode.id },
        };
        const turns = parsePodcastDialogue(script);
        const audio =
          turns.length >= 2
            ? await synthesizeDialogue(turns, locale, ttsUsage)
            : await synthesizeSpeech(script, locale, ttsUsage);
        const audioPath = await storageService.save(audio, `${locale}/${episode.id}.mp3`);
        const wordCount = script.split(/\s+/).length;
        await prisma.podcastEpisode.update({
          where: { id: episode.id },
          data: { audioPath, durationSec: Math.max(60, Math.round((wordCount / 150) * 60)) },
        });
      } catch (err) {
        console.error(`TTS failed for episode ${episode.id}:`, err);
      }
      const withAudio = await prisma.podcastEpisode.count({
        where: { podcastId, audioPath: { not: null } },
      });
      await prisma.podcast.update({
        where: { id: podcastId },
        data: { status: withAudio > 0 ? 'READY' : 'FAILED' },
      });
      return;
    }

    const existingEpisodes = await prisma.podcastEpisode.findMany({
      where: { podcastId },
    });
    await Promise.all(
      existingEpisodes
        .filter((e) => e.audioPath)
        .map((e) => storageService.delete(e.audioPath!)),
    );
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

      // Use the WHOLE section (it's already a bounded slice of the document) rather
      // than the first 15 chunks, so the episode covers the section fully.
      const chunks = await prisma.chunk.findMany({
        where: {
          contentId,
          chunkIndex: { gte: sec.startChunk, lte: sec.endChunk },
        },
        orderBy: { chunkIndex: 'asc' },
      });

      const context =
        chunks.length > 0
          ? boundContextByTokens(
              buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex }))),
              8000,
            )
          : '';

      const script = await generateChatCompletion(
        [
          { role: 'system', content: getPodcastSystemPrompt(locale) },
          {
            role: 'user',
            content: buildPodcastUserPrompt(locale, sec.title, context || content.title),
          },
        ],
        {
          userId: content.userId,
          feature: 'PODCAST_GEN',
          metadata: { contentId, podcastId },
        },
      );

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
        // Two-host conversation when the model produced an A:/B: dialogue (each
        // host gets a distinct native voice); fall back to single-voice narration.
        const ttsUsage = {
          userId: content.userId,
          metadata: { contentId, podcastId, episodeId: episode.id },
        };
        const turns = parsePodcastDialogue(script);
        const audio =
          turns.length >= 2
            ? await synthesizeDialogue(turns, locale, ttsUsage)
            : await synthesizeSpeech(script, locale, ttsUsage);
        const audioPath = await storageService.save(audio, `${locale}/${episode.id}.mp3`);
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
