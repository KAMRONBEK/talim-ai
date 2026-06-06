'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
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
