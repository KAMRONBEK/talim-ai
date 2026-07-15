import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';
import OpenAI, { toFile } from 'openai';
import { env } from '../config/env.js';
import { recordUsage, type UsageContext } from './usage.service.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

type TranscriptSegmentSource = 'YOUTUBE_CAPTIONS' | 'AI_TRANSCRIPTION';

interface TranscriptSegmentInput {
  order: number;
  startMs: number;
  endMs: number;
  text: string;
  source: TranscriptSegmentSource;
}

export interface YoutubeTranscriptResult {
  text: string;
  segments: TranscriptSegmentInput[];
  source: TranscriptSegmentSource;
}

interface YoutubeTranscriptItem {
  text: string;
  offset?: number;
  duration?: number;
}

interface OpenAITranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface OpenAIVerboseTranscription {
  text?: string;
  segments?: OpenAITranscriptionSegment[];
}

const AUDIO_MIME_TYPE = 'audio/mpeg';

export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function cleanTranscriptText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeCaptionSegments(items: YoutubeTranscriptItem[]): TranscriptSegmentInput[] {
  return items
    .map((item, index) => {
      const text = cleanTranscriptText(item.text);
      const startMs = Math.max(0, Math.round(item.offset ?? 0));
      const durationMs = Math.max(1, Math.round(item.duration ?? 0));
      return {
        order: index,
        startMs,
        endMs: startMs + durationMs,
        text,
        source: 'YOUTUBE_CAPTIONS' as const,
      };
    })
    .filter((segment) => segment.text);
}

function normalizeTranscriptionSegments(
  segments: OpenAITranscriptionSegment[],
): TranscriptSegmentInput[] {
  return segments
    .map((segment, index) => {
      const startMs = Math.max(0, Math.round(segment.start * 1000));
      const endMs = Math.max(startMs + 1, Math.round(segment.end * 1000));
      return {
        order: index,
        startMs,
        endMs,
        text: cleanTranscriptText(segment.text),
        source: 'AI_TRANSCRIPTION' as const,
      };
    })
    .filter((segment) => segment.text);
}

function fallbackTextSegments(text: string): TranscriptSegmentInput[] {
  const cleaned = cleanTranscriptText(text);
  if (!cleaned) return [];
  return [
    {
      order: 0,
      startMs: 0,
      endMs: 1,
      text: cleaned,
      source: 'AI_TRANSCRIPTION',
    },
  ];
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function extractYoutubeAudio(url: string): Promise<Buffer> {
  const stream = ytdl(url, {
    quality: 'highestaudio',
    filter: 'audioonly',
  });
  return streamToBuffer(stream);
}

function buildTranscriptionPrompt(options?: { title?: string; locale?: string }): string {
  const parts = [
    'Transcribe this educational YouTube tutorial accurately.',
    'Preserve technical terms, names, formulas, and the original spoken language.',
  ];
  if (options?.title) {
    parts.push(`Video title: ${options.title}.`);
  }
  if (options?.locale) {
    parts.push(`Learner interface locale: ${options.locale}.`);
  }
  return parts.join(' ');
}

async function generateYoutubeTranscript(
  url: string,
  options?: { title?: string; locale?: string; usage?: UsageContext },
): Promise<YoutubeTranscriptResult> {
  if (!openai) {
    throw new Error('No transcript available for this video');
  }

  const audio = await extractYoutubeAudio(url);
  const response = (await openai.audio.transcriptions.create({
    file: await toFile(audio, 'youtube-audio.mp3', { type: AUDIO_MIME_TYPE }),
    model: env.TRANSCRIPTION_MODEL,
    prompt: buildTranscriptionPrompt(options),
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })) as OpenAIVerboseTranscription;

  const segments = response.segments?.length
    ? normalizeTranscriptionSegments(response.segments)
    : fallbackTextSegments(response.text ?? '');
  const text = cleanTranscriptText(
    response.text ?? segments.map((segment) => segment.text).join(' '),
  );
  if (!text || segments.length === 0) {
    throw new Error('No transcript available for this video');
  }

  if (options?.usage) {
    const durationSec = segments.reduce((max, s) => Math.max(max, s.endMs / 1000), 0);
    recordUsage({
      userId: options.usage.userId,
      tenantId: options.usage.tenantId,
      feature: 'TRANSCRIBE',
      model: env.TRANSCRIPTION_MODEL,
      inputTokens: Math.round(durationSec),
      outputTokens: 0,
      metadata: { ...options.usage.metadata, durationSec },
    });
  }

  return { text, segments, source: 'AI_TRANSCRIPTION' };
}

export async function extractYoutubeTranscript(
  url: string,
  options?: { title?: string; locale?: string; usage?: UsageContext },
): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    const transcript = (await YoutubeTranscript.fetchTranscript(
      videoId,
    )) as YoutubeTranscriptItem[];
    const segments = normalizeCaptionSegments(transcript);
    const text = cleanTranscriptText(segments.map((segment) => segment.text).join(' '));
    if (text && segments.length > 0) {
      return { text, segments, source: 'YOUTUBE_CAPTIONS' };
    }
  } catch {
    // Fall back to context-aware AI transcription below.
  }

  return generateYoutubeTranscript(url, options);
}
