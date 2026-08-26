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

/**
 * Longest video we will download and transcribe.
 *
 * Not an arbitrary product limit — it is the point past which the request cannot succeed. OpenAI
 * caps audio/transcriptions at 26,214,400 bytes, and even at the low-bitrate format selected
 * below a longer video exceeds it. Without this the job downloaded for minutes, spiked the RAM of
 * a process that is simultaneously the API and all ten Bull workers, and then always 413'd.
 */
const MAX_TRANSCRIBE_DURATION_SEC = 30 * 60;

/** Hard byte ceiling, under OpenAI's 26,214,400. contentLength can be absent or simply wrong. */
const MAX_TRANSCRIBE_AUDIO_BYTES = 24 * 1024 * 1024;

/** Thrown before (or during) download when a video cannot be transcribed at any cost. */
export class VideoTooLongError extends Error {
  readonly code = 'VIDEO_TOO_LONG' as const;

  constructor(
    readonly durationSec: number | null,
    readonly limitSec: number = MAX_TRANSCRIBE_DURATION_SEC,
  ) {
    super('This video is too long to transcribe');
    this.name = 'VideoTooLongError';
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    // Bound worst-case RSS per job regardless of what the metadata claimed. Destroying the
    // stream stops the download rather than letting it run to completion just to be rejected.
    if (total > MAX_TRANSCRIBE_AUDIO_BYTES) {
      (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
      throw new VideoTooLongError(null);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

async function extractYoutubeAudio(url: string): Promise<{ audio: Buffer; container: string }> {
  // getInfo BEFORE downloading: the duration and the format's byte length are both available up
  // front, and nothing was reading either of them.
  const info = await ytdl.getInfo(url);
  const durationSec = Number(info.videoDetails?.lengthSeconds ?? 0);
  if (Number.isFinite(durationSec) && durationSec > MAX_TRANSCRIBE_DURATION_SEC) {
    throw new VideoTooLongError(durationSec);
  }

  // lowestaudio, not highestaudio: Whisper gains nothing from bitrate, and the smaller stream
  // both quarters the memory and lifts how many minutes fit under the 25 MB request cap.
  const format = ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' });
  const declared = Number(format.contentLength ?? 0);
  if (Number.isFinite(declared) && declared > MAX_TRANSCRIBE_AUDIO_BYTES) {
    throw new VideoTooLongError(Number.isFinite(durationSec) ? durationSec : null);
  }

  const stream = ytdl.downloadFromInfo(info, { format });
  return { audio: await streamToBuffer(stream), container: format.container || 'mp4' };
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

  const { audio, container } = await extractYoutubeAudio(url);
  const response = (await openai.audio.transcriptions.create({
    // Name it by its real container. It was always labelled .mp3 / audio/mpeg regardless of what
    // was actually downloaded, which is a lie the transcription API has to work around.
    file: await toFile(audio, `youtube-audio.${container}`, { type: AUDIO_MIME_TYPE }),
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
