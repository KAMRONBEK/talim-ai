import { Prisma } from '@prisma/client';
import { parseAppLocale, type PodcastSegment } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';
import { generateChatCompletion } from '../services/ai.service.js';
import { buildRagContext, boundContextByTokens } from '../services/rag.service.js';
import { podcastQueue, type GeneratePodcastJobData } from '../services/queue.service.js';
import {
  synthesizeSpeech,
  synthesizeDialogueWithSegments,
  type DialogueTurn,
  type DialogueSegmentBytes,
} from '../services/tts.service.js';
import { storageService } from '../services/storage.service.js';
import {
  getPodcastSystemPrompt,
  buildPodcastUserPrompt,
  parsePodcastDialogue,
} from '../lib/locale-prompts.js';

// Azure emits audio-24khz-48kbitrate-mono-mp3 (48 kbit/s = 6000 bytes/s) and
// OpenAI's mp3 is near-CBR, so each turn's audio byte length is an accurate proxy
// for its duration: 48000 bits/s ÷ 8 = 6000 bytes/s ⇒ 6 bytes per millisecond.
const TTS_BYTES_PER_MS = 6;

/**
 * Build a time-aligned transcript from the dialogue turns + their per-turn audio
 * byte lengths (aligned 1:1). Timings are proportional/CBR-derived — the web player
 * rescales them to the true <audio> duration for provider-agnostic accuracy.
 */
function buildPodcastSegments(
  turns: DialogueTurn[],
  byteSegments: DialogueSegmentBytes[],
): PodcastSegment[] {
  const segments: PodcastSegment[] = [];
  let cursorMs = 0;
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i]!;
    const bytes = byteSegments[i]?.bytes ?? 0;
    const startMs = cursorMs;
    const endMs = startMs + Math.round(bytes / TTS_BYTES_PER_MS);
    segments.push({ speaker: turn.speaker, text: turn.text, startMs, endMs });
    cursorMs = endMs;
  }
  return segments;
}

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
          parentId: null,
          depth: 0,
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
        data: { script, audioPath: null, durationSec: null, segments: Prisma.DbNull },
      });
      try {
        const ttsUsage = {
          userId: content.userId,
          metadata: { contentId, podcastId, episodeId: episode.id },
        };
        const turns = parsePodcastDialogue(script);
        let segments: PodcastSegment[] | null = null;
        let audio: Buffer;
        if (turns.length >= 2) {
          const result = await synthesizeDialogueWithSegments(turns, locale, ttsUsage);
          audio = result.audio;
          segments = buildPodcastSegments(turns, result.segments);
        } else {
          audio = await synthesizeSpeech(script, locale, ttsUsage);
        }
        const audioPath = await storageService.save(audio, `${locale}/${episode.id}.mp3`);
        const wordCount = script.split(/\s+/).length;
        await prisma.podcastEpisode.update({
          where: { id: episode.id },
          data: {
            audioPath,
            durationSec: Math.max(60, Math.round((wordCount / 150) * 60)),
            segments: segments ? (segments as unknown as object) : Prisma.DbNull,
          },
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
      void publishContentEvent(contentId, {
        type: 'podcast.status',
        contentId,
        episodeId,
        status: withAudio > 0 ? 'READY' : 'FAILED',
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
          parentId: null,
          depth: 0,
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
        let segments: PodcastSegment[] | null = null;
        let audio: Buffer;
        if (turns.length >= 2) {
          const result = await synthesizeDialogueWithSegments(turns, locale, ttsUsage);
          audio = result.audio;
          segments = buildPodcastSegments(turns, result.segments);
        } else {
          audio = await synthesizeSpeech(script, locale, ttsUsage);
        }
        const audioPath = await storageService.save(audio, `${locale}/${episode.id}.mp3`);
        const wordCount = script.split(/\s+/).length;
        await prisma.podcastEpisode.update({
          where: { id: episode.id },
          data: {
            audioPath,
            durationSec: Math.max(60, Math.round((wordCount / 150) * 60)),
            segments: segments ? (segments as unknown as object) : Prisma.DbNull,
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
    void publishContentEvent(contentId, {
      type: 'podcast.status',
      contentId,
      status: audioCount > 0 ? 'READY' : 'FAILED',
    });
  });

  podcastQueue.on('failed', async (job, err) => {
    console.error(`Podcast job ${job?.id} failed:`, err.message);
    const data = job?.data as GeneratePodcastJobData | undefined;
    if (!data?.podcastId) return;
    if (data.episodeId) {
      // A single-episode (manual per-section) regeneration that fails must NOT nuke
      // the whole podcast — keep it READY as long as another episode still has audio
      // (mirrors the success path at lines 97-103).
      const withAudio = await prisma.podcastEpisode.count({
        where: { podcastId: data.podcastId, audioPath: { not: null } },
      });
      const status = withAudio > 0 ? 'READY' : 'FAILED';
      await prisma.podcast.update({ where: { id: data.podcastId }, data: { status } });
      await publishContentEvent(data.contentId, {
        type: 'podcast.status',
        contentId: data.contentId,
        episodeId: data.episodeId,
        status,
      });
      return;
    }
    await prisma.podcast.update({ where: { id: data.podcastId }, data: { status: 'FAILED' } });
    await publishContentEvent(data.contentId, {
      type: 'podcast.status',
      contentId: data.contentId,
      status: 'FAILED',
    });
  });
}
