'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { Deck, VideoSegment } from '@talim/types';
import { Slide } from './Slide';

const STAGE_W = 1280;
const STAGE_H = 720;

/**
 * Plays a generated "AI video" — a narrated slideshow. Each deck slide is shown
 * while its TTS narration clip plays; on clip end it auto-advances to the next
 * slide. `loadAudioUrl` returns an authenticated blob URL for a segment index
 * (the page owns auth + the role-aware base path).
 */
export function NarratedVideoPlayer({
  deck,
  segments,
  loadAudioUrl,
  playLabel,
  pauseLabel,
}: {
  deck: Deck;
  segments: VideoSegment[];
  loadAudioUrl: (index: number) => Promise<string>;
  playLabel: string;
  pauseLabel: string;
}) {
  const total = Math.min(deck.slides.length, segments.length);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scale, setScale] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<string | null>(null);

  const clamp = useCallback((n: number) => Math.max(0, Math.min(n, total - 1)), [total]);

  // Scale the fixed 1280×720 canvas to fit the stage (mirrors DeckPlayer).
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setScale(Math.min(width / STAGE_W, height / STAGE_H));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load + (optionally) play the current segment's narration whenever the slide
  // changes. Segments without audio fall back to a timed advance.
  useEffect(() => {
    const seg = segments[index];
    const audio = audioRef.current;
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const revoke = () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };

    if (!seg || !seg.hasAudio || !audio) {
      // No clip — hold the slide for its estimated duration, then advance.
      if (playing && seg) {
        fallbackTimer = setTimeout(() => {
          if (!cancelled) setIndex((i) => (i < total - 1 ? i + 1 : i));
        }, Math.max(2000, seg.durationSec * 1000));
      }
      return () => {
        cancelled = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }

    loadAudioUrl(index)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoke();
        blobRef.current = url;
        audio.src = url;
        if (playing) void audio.play().catch(() => undefined);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, total]);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const onEnded = useCallback(() => {
    setIndex((i) => {
      if (i < total - 1) return i + 1;
      setPlaying(false);
      return i;
    });
  }, [total]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    setPlaying((p) => {
      const next = !p;
      if (audio) {
        if (next) void audio.play().catch(() => undefined);
        else audio.pause();
      }
      return next;
    });
  }, []);

  const goTo = useCallback(
    (n: number) => {
      setIndex(clamp(n));
    },
    [clamp],
  );

  const slide = deck.slides[index];
  if (!slide || total === 0) return null;
  const progress = (index + 1) / total;

  return (
    <div className="relative flex h-full w-full flex-col bg-zinc-100 dark:bg-zinc-950">
      <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        {scale > 0 && (
          <div style={{ width: STAGE_W * scale, height: STAGE_H * scale }} className="relative">
            <div
              style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              className="shadow-2xl shadow-black/20"
            >
              <Slide slide={slide} index={index} deckAccent={deck.accent} />
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} onEnded={onEnded} className="hidden" />

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full origin-left rounded-r-full bg-[var(--slide-accent,theme(colors.primary.DEFAULT))] transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 border-t bg-card/80 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0 truncate text-sm font-medium text-muted-foreground">{deck.title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? pauseLabel : playLabel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-white shadow-soft transition-transform duration-150 hover:-translate-y-0.5"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
          </button>
          <span className="min-w-[64px] text-center text-sm font-semibold tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
            aria-label="Next slide"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
