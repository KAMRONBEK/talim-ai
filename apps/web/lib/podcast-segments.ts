import type { TranscriptSegment } from '@talim/types';

// Speaker label at the start of a dialogue line, e.g. "A:", "B -", "А)", "Б —"
// (Latin A/B + Cyrillic А/Б, mirroring the API's parsePodcastDialogue). We keep
// the spoken text but drop the bare label so the transcript reads cleanly.
const SPEAKER_LABEL_RE = /^\s*([ABАБ])\s*[:).\-–—]\s*/;
// Sentence boundary: end punctuation followed by whitespace.
const SENTENCE_SPLIT_RE = /(?<=[.!?…])\s+/;

/**
 * Derive an ESTIMATED, time-aligned transcript from a podcast episode's TTS
 * script and the audio element's runtime duration.
 *
 * The script has no real timestamps, so each segment's start/end is assigned by
 * cumulative character proportion × total duration — good enough to highlight
 * the roughly-current line as the audio plays and to support click-to-seek.
 * This is deliberately NOT word-accurate; it is a "following" transcript.
 *
 * Returns [] for missing/empty script or a non-positive duration, so callers can
 * treat "no segments" as "transcript not synced" and render exactly as before.
 */
export function derivePodcastSegments(
  script: string | null | undefined,
  durationSec: number,
): TranscriptSegment[] {
  if (!script || !script.trim()) return [];
  if (!Number.isFinite(durationSec) || durationSec <= 0) return [];

  const pieces: string[] = [];
  for (const rawLine of script.split(/\r?\n/)) {
    const line = rawLine.replace(SPEAKER_LABEL_RE, '').trim();
    if (!line) continue;
    for (const sentence of line.split(SENTENCE_SPLIT_RE)) {
      const text = sentence.trim();
      if (text) pieces.push(text);
    }
  }
  if (pieces.length === 0) return [];

  // Weight each segment by its character count (min 1 so a stray short line
  // still advances the clock) and spread the timeline proportionally.
  const weights = pieces.map((p) => Math.max(1, p.length));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const durationMs = durationSec * 1000;

  let acc = 0;
  return pieces.map((text, i) => {
    const startMs = Math.round((acc / total) * durationMs);
    acc += weights[i]!;
    const endMs = Math.round((acc / total) * durationMs);
    return {
      id: `podcast-est-${i}`,
      contentId: '',
      order: i,
      startMs,
      endMs,
      text,
      source: 'AI_TRANSCRIPTION',
    } satisfies TranscriptSegment;
  });
}
