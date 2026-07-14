'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { TranscriptSegment } from '@talim/types';
import { cn } from '@talim/ui';

export interface TranscriptExcerptPayload {
  excerpt: string;
  startMs: number;
  endMs: number;
}

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  currentMs: number;
  onSeek: (timeMs: number) => void;
  /**
   * Enables the "select transcript text → ask the AI tutor" affordance. When
   * omitted (e.g. the podcast player, which only needs synced highlight +
   * click-to-seek), text selection is not tracked and the ask-hint is hidden.
   */
  onExcerptSelected?: (payload: TranscriptExcerptPayload) => void;
  onSelectionCleared?: () => void;
  /**
   * Which medium this transcript syncs to — drives the click-to-seek hint copy
   * ("…of the video" vs "…of the audio"). Defaults to 'video'; the podcast
   * player passes 'audio' so the hint doesn't wrongly say "video".
   */
  mediaKind?: 'video' | 'audio';
}

interface TranscriptSentence {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
  segmentOrders: number[];
}

interface TranscriptParagraph {
  index: number;
  sentences: TranscriptSentence[];
}

const HIGHLIGHT_LEAD_MS = 650;
const SENTENCE_GAP_MS = 1200;
const PARAGRAPH_GAP_MS = 4500;
const MAX_SENTENCE_CHARS = 220;
const MAX_PARAGRAPH_SENTENCES = 4;
const SENTENCE_END_RE = /[.!?。！？…]["')\]]?$/;

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getSentenceIndex(node: Node | null): number | null {
  const element =
    node instanceof Element ? node : node?.parentElement instanceof Element ? node.parentElement : null;
  const sentenceElement = element?.closest<HTMLElement>('[data-transcript-sentence]');
  const value = sentenceElement?.dataset.transcriptSentence;
  if (!value) return null;
  const index = Number(value);
  return Number.isFinite(index) ? index : null;
}

function buildSentences(segments: TranscriptSegment[]): TranscriptSentence[] {
  const sentences: TranscriptSentence[] = [];
  let current: Omit<TranscriptSentence, 'index'> | null = null;

  const flush = () => {
    if (!current?.text.trim()) return;
    sentences.push({
      ...current,
      index: sentences.length,
      text: current.text.replace(/\s+/g, ' ').trim(),
    });
    current = null;
  };

  segments.forEach((segment, segmentIndex) => {
    const text = segment.text.replace(/\s+/g, ' ').trim();
    if (!text) return;

    if (!current) {
      current = {
        startMs: segment.startMs,
        endMs: segment.endMs,
        text,
        segmentOrders: [segment.order],
      };
    } else {
      current.text = `${current.text} ${text}`;
      current.endMs = segment.endMs;
      current.segmentOrders.push(segment.order);
    }

    const next = segments[segmentIndex + 1];
    const hasSentenceEnd = SENTENCE_END_RE.test(text);
    const hasLongGap = next ? next.startMs - segment.endMs > SENTENCE_GAP_MS : false;
    const isLongSentence = current.text.length >= MAX_SENTENCE_CHARS;
    if (hasSentenceEnd || hasLongGap || isLongSentence || !next) {
      flush();
    }
  });

  return sentences;
}

function buildParagraphs(sentences: TranscriptSentence[]): TranscriptParagraph[] {
  const paragraphs: TranscriptParagraph[] = [];
  let current: TranscriptSentence[] = [];

  const flush = () => {
    if (current.length === 0) return;
    paragraphs.push({ index: paragraphs.length, sentences: current });
    current = [];
  };

  sentences.forEach((sentence, index) => {
    const previous = current.at(-1);
    if (
      previous &&
      (sentence.startMs - previous.endMs > PARAGRAPH_GAP_MS ||
        current.length >= MAX_PARAGRAPH_SENTENCES)
    ) {
      flush();
    }
    current.push(sentence);
    if (index === sentences.length - 1) flush();
  });

  return paragraphs;
}

export function formatTranscriptExcerpt(payload: TranscriptExcerptPayload): string {
  return `[${formatTimestamp(payload.startMs)}-${formatTimestamp(payload.endMs)}] ${payload.excerpt}`;
}

export function TranscriptPanel({
  segments,
  currentMs,
  onSeek,
  onExcerptSelected,
  onSelectionCleared,
  mediaKind = 'video',
}: TranscriptPanelProps) {
  const t = useTranslations('content');
  const activeRef = useRef<HTMLSpanElement | null>(null);
  const selectionEnabled = Boolean(onExcerptSelected);
  const sentences = useMemo(() => buildSentences(segments), [segments]);
  const paragraphs = useMemo(() => buildParagraphs(sentences), [sentences]);
  const activeSentenceIndex = useMemo(() => {
    const highlightMs = currentMs + HIGHLIGHT_LEAD_MS;
    const active = sentences.find(
      (sentence) => highlightMs >= sentence.startMs && currentMs < sentence.endMs,
    );
    return active?.index ?? null;
  }, [currentMs, sentences]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSentenceIndex]);

  const handleSelectionEnd = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().replace(/\s+/g, ' ').trim() ?? '';
    if (!selection || !selectedText) {
      onSelectionCleared?.();
      return;
    }

    const anchorIndex = getSentenceIndex(selection.anchorNode);
    const focusIndex = getSentenceIndex(selection.focusNode);
    if (anchorIndex == null || focusIndex == null) return;

    const startIndex = Math.min(anchorIndex, focusIndex);
    const endIndex = Math.max(anchorIndex, focusIndex);
    const selectedSentences = sentences.filter(
      (sentence) => sentence.index >= startIndex && sentence.index <= endIndex,
    );
    const first = selectedSentences[0];
    const last = selectedSentences.at(-1);
    if (!first || !last) return;

    onExcerptSelected?.({
      excerpt: selectedText,
      startMs: first.startMs,
      endMs: last.endMs,
    });
  };

  if (sentences.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        {t('transcriptNotAvailable')}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
      <div className="shrink-0 border-b px-3 py-2">
        <p className="text-xs font-medium">{t('transcript')}</p>
        {selectionEnabled ? (
          <p className="text-[11px] text-muted-foreground">{t('selectTranscriptToAsk')}</p>
        ) : null}
      </div>
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto break-words p-4 text-sm leading-7"
        onPointerUp={selectionEnabled ? handleSelectionEnd : undefined}
      >
        {paragraphs.map((paragraph) => (
          <p key={paragraph.index} className="text-foreground">
            {paragraph.sentences.map((sentence) => {
              const isActive = sentence.index === activeSentenceIndex;
              return (
                <span
                  key={sentence.index}
                  ref={isActive ? activeRef : undefined}
                  role="button"
                  tabIndex={0}
                  data-transcript-sentence={sentence.index}
                  title={formatTimestamp(sentence.startMs)}
                  onClick={() => onSeek(sentence.startMs)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSeek(sentence.startMs);
                    }
                  }}
                  className={cn(
                    'cursor-pointer rounded px-1 py-0.5 transition-colors',
                    isActive ? 'bg-primary/20 text-foreground' : 'hover:bg-muted',
                  )}
                >
                  {sentence.text}
                  {' '}
                </span>
              );
            })}
          </p>
        ))}
        <div className="pt-2 text-[11px] text-muted-foreground">
          {paragraphs.length > 0
            ? t(mediaKind === 'audio' ? 'transcriptClickToSeekAudio' : 'transcriptClickToSeek')
            : null}
        </div>
      </div>
    </div>
  );
}
