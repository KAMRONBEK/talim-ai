'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TranscriptSegment } from '@talim/types';
import { cn } from '@talim/ui';
import { getYoutubeVideoId } from '@/lib/youtube';
import { useTranscript } from '@/hooks/useTranscript';
import { YoutubeVideoPlayer } from './YoutubeVideoPlayer';
import {
  formatTranscriptExcerpt,
  TranscriptPanel,
  type TranscriptExcerptPayload,
} from './TranscriptPanel';

interface VideoTutorialViewerProps {
  contentId: string;
  url: string;
  onExcerptSelected: (payload: TranscriptExcerptPayload & { label: string }) => void;
  onSelectionCleared?: () => void;
}

interface VideoChapter {
  startMs: number;
  label: string;
}

const CHAPTER_TARGET_COUNT = 6;
const CHAPTER_MIN_WINDOW_MS = 45_000;
const CHAPTER_LABEL_MAX = 42;

function formatChapterTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Derive coarse chapter markers from the transcript timestamps the viewer already
 * loads: group segments into evenly spaced windows and label each with the first
 * line spoken in it. No new data is fetched or invented — when there is no
 * transcript the list is simply empty and the chapters strip is not rendered.
 */
function deriveChapters(segments: TranscriptSegment[]): VideoChapter[] {
  if (segments.length === 0) return [];
  const totalMs = segments[segments.length - 1]?.endMs ?? 0;
  if (totalMs <= 0) return [];
  const windowMs = Math.max(CHAPTER_MIN_WINDOW_MS, Math.ceil(totalMs / CHAPTER_TARGET_COUNT));
  const chapters: VideoChapter[] = [];
  let nextThreshold = 0;
  for (const segment of segments) {
    if (segment.startMs < nextThreshold) continue;
    const label = segment.text.replace(/\s+/g, ' ').trim();
    if (!label) continue;
    chapters.push({
      startMs: segment.startMs,
      label:
        label.length > CHAPTER_LABEL_MAX
          ? `${label.slice(0, CHAPTER_LABEL_MAX).trimEnd()}…`
          : label,
    });
    nextThreshold = segment.startMs + windowMs;
  }
  return chapters;
}

export function VideoTutorialViewer({
  contentId,
  url,
  onExcerptSelected,
  onSelectionCleared,
}: VideoTutorialViewerProps) {
  const t = useTranslations('content');
  const videoId = getYoutubeVideoId(url);
  const { data: transcript, isLoading, isError } = useTranscript(contentId, Boolean(videoId));
  const [currentMs, setCurrentMs] = useState(0);
  const [seekTarget, setSeekTarget] = useState<{ key: number; ms: number } | null>(null);

  const handleSeek = useCallback((ms: number) => {
    setSeekTarget({ key: Date.now(), ms });
  }, []);

  const handleExcerptSelected = useCallback(
    (payload: TranscriptExcerptPayload) => {
      onExcerptSelected({ ...payload, label: formatTranscriptExcerpt(payload) });
    },
    [onExcerptSelected],
  );

  const chapters = useMemo(
    () => deriveChapters(transcript?.segments ?? []),
    [transcript?.segments],
  );
  const activeChapterIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < chapters.length; i += 1) {
      const chapter = chapters[i];
      if (chapter && chapter.startMs <= currentMs) index = i;
      else break;
    }
    return index;
  }, [chapters, currentMs]);

  if (!videoId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
        <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
          {t('openVideo')}
        </a>
        <p>{t('videoEmbedUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2 md:gap-3 md:p-3">
      <YoutubeVideoPlayer
        videoId={videoId}
        seekMs={seekTarget?.ms ?? null}
        seekKey={seekTarget?.key ?? null}
        onTimeChange={setCurrentMs}
      />
      {chapters.length > 0 && !isLoading && !isError ? (
        <div className="shrink-0">
          <p className="mb-1.5 px-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t('chapters')}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chapters.map((chapter, index) => {
              const isActive = index === activeChapterIndex;
              return (
                <button
                  key={chapter.startMs}
                  type="button"
                  onClick={() => handleSeek(chapter.startMs)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'flex max-w-[220px] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                    isActive
                      ? 'border-primary/30 bg-secondary text-secondary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 text-[11px] font-bold tabular-nums',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {formatChapterTime(chapter.startMs)}
                  </span>
                  <span className="truncate text-[13px] font-medium">{chapter.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          {t('transcriptLoading')}
        </div>
      ) : isError ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
          {t('transcriptLoadError')}
        </div>
      ) : (
        <TranscriptPanel
          segments={transcript?.segments ?? []}
          currentMs={currentMs}
          onSeek={handleSeek}
          onExcerptSelected={handleExcerptSelected}
          onSelectionCleared={onSelectionCleared}
        />
      )}
    </div>
  );
}
