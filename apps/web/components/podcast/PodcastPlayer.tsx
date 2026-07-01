'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mic } from 'lucide-react';
import { Button } from '@talim/ui';
import type { TranscriptSegment } from '@talim/types';
import { TranscriptPanel } from '@/components/learning/TranscriptPanel';
import { derivePodcastSegments } from '@/lib/podcast-segments';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isNearEnd(current: number, duration: number): boolean {
  return duration > 0 && current >= duration - 2;
}

interface PodcastPlayerProps {
  audioUrl: string;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  initialPositionSec?: number;
  onProgress?: (listenedSec: number, completed: boolean) => void;
  /**
   * Transcript segments whose start/end timestamps are aligned to THIS audio
   * timeline. When provided, a synced transcript is rendered under the
   * controls: the current segment is highlighted + auto-scrolled as the audio
   * plays (driven by the <audio> timeupdate event), and clicking a segment
   * seeks the audio. Omit when no aligned transcript exists — the player then
   * renders exactly as before.
   *
   * Takes precedence over `script`: pass this when real aligned segments exist.
   */
  segments?: TranscriptSegment[];
  /**
   * The episode's TTS script. When `segments` is not supplied, the player
   * derives an ESTIMATED time-aligned transcript from this once the audio's
   * duration is known (segment start/end by cumulative character proportion ×
   * duration). Missing/empty script → no synced transcript (renders as before).
   */
  script?: string;
}

export function PodcastPlayer({
  audioUrl,
  playbackRate,
  onPlaybackRateChange,
  initialPositionSec = 0,
  onProgress,
  segments,
  script,
}: PodcastPlayerProps) {
  const t = useTranslations('content');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const restoredRef = useRef(false);

  const reportProgress = (time: number, dur: number) => {
    onProgress?.(Math.floor(time), isNearEnd(time, dur));
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
  }, [playbackRate, audioUrl]);

  useEffect(() => {
    restoredRef.current = false;
  }, [audioUrl]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const skip = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  };

  // Shared seek used by the scrubber and by clicking a transcript segment, so
  // both keep the displayed time + saved progress in sync with the audio.
  const seekTo = (seconds: number) => {
    const el = audioRef.current;
    const max = el?.duration || duration || 0;
    const next = max > 0 ? Math.max(0, Math.min(max, seconds)) : Math.max(0, seconds);
    if (el) el.currentTime = next;
    setCurrent(next);
    reportProgress(next, duration);
  };

  // Prefer real aligned segments if supplied; otherwise estimate them from the
  // script once the audio's duration is known. Recomputes when the script or
  // duration changes (i.e. when the selected episode or its audio changes).
  const derivedSegments = useMemo(
    () => (segments && segments.length > 0 ? null : derivePodcastSegments(script, duration)),
    [segments, script, duration],
  );
  const effectiveSegments =
    segments && segments.length > 0 ? segments : (derivedSegments ?? []);
  const hasTranscript = effectiveSegments.length > 0;

  return (
    <div className="w-full max-w-xl space-y-4">
      <audio
        ref={audioRef}
        key={audioUrl}
        src={audioUrl}
        className="hidden"
        onTimeUpdate={() => {
          const t = audioRef.current?.currentTime ?? 0;
          const d = audioRef.current?.duration ?? 0;
          setCurrent(t);
          reportProgress(t, d);
        }}
        onLoadedMetadata={() => {
          const el = audioRef.current;
          if (el) {
            setDuration(el.duration);
            el.playbackRate = playbackRate;
            if (!restoredRef.current && initialPositionSec > 0) {
              el.currentTime = initialPositionSec;
              setCurrent(initialPositionSec);
              restoredRef.current = true;
            }
          }
        }}
        onEnded={() => {
          setPlaying(false);
          reportProgress(duration, duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* Designed cover artwork — pine tile with the girih lattice + clay wash treatment. */}
      <div
        aria-hidden
        className="relative isolate mx-auto flex aspect-square w-40 items-center justify-center overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-elevated sm:w-44"
      >
        <span className="bg-girih pointer-events-none absolute inset-0 opacity-40 mix-blend-screen" />
        <span className="bg-brand-radial pointer-events-none absolute inset-0 opacity-70" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-foreground/15 via-transparent to-transparent" />
        <Mic className="relative z-10 h-14 w-14" strokeWidth={1.5} />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={current}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
        onChange={(e) => seekTo(Number(e.target.value))}
      />
      <div className="flex items-center justify-center gap-4">
        <Button type="button" variant="outline" size="sm" onClick={() => skip(-15)}>
          −15s
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={togglePlay}
        >
          {playing ? '⏸' : '▶'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => skip(15)}>
          +15s
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('playbackSpeed')}</span>
        {[0.75, 1, 1.25, 1.5].map((rate) => (
          <button
            key={rate}
            type="button"
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              playbackRate === rate
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
            onClick={() => onPlaybackRateChange(rate)}
          >
            {rate}x
          </button>
        ))}
      </div>
      {hasTranscript ? (
        <div className="flex h-72 w-full flex-col">
          <TranscriptPanel
            segments={effectiveSegments}
            currentMs={Math.round(current * 1000)}
            onSeek={(ms) => seekTo(ms / 1000)}
          />
        </div>
      ) : null}
    </div>
  );
}
