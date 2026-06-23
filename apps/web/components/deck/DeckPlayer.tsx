'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { cn } from '@talim/ui';
import type { Deck } from '@talim/types';
import { Slide } from './Slide';

const STAGE_W = 1280;
const STAGE_H = 720;

interface FullscreenEl extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}
interface FullscreenDoc extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
}

export function DeckPlayer({ deck }: { deck: Deck }) {
  const total = deck.slides.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (next: number, direction: 'next' | 'prev') => {
      setDir(direction);
      setIndex((prev) => {
        const clamped = Math.max(0, Math.min(next, total - 1));
        return clamped === prev ? prev : clamped;
      });
    },
    [total],
  );
  const next = useCallback(() => goTo(index + 1, 'next'), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, 'prev'), [goTo, index]);

  // Scale the fixed 1280×720 canvas to fit the stage; measure before paint.
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

  // Keyboard navigation (ignores typing in inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0, 'prev');
          break;
        case 'End':
          e.preventDefault();
          goTo(total - 1, 'next');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, goTo, total]);

  // Track fullscreen state from the document (covers Esc + webkit).
  useEffect(() => {
    const doc = document as FullscreenDoc;
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current as FullscreenEl | null;
    const doc = document as FullscreenDoc;
    if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
      void (root?.requestFullscreen?.() ?? root?.webkitRequestFullscreen?.());
    } else {
      void (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
    }
  }, []);

  const slide = deck.slides[index];
  if (!slide) return null;
  const progress = (index + 1) / total;

  return (
    <div
      ref={rootRef}
      className="relative flex h-full w-full flex-col bg-zinc-100 dark:bg-zinc-950"
      role="region"
      aria-roledescription="carousel"
      aria-label={deck.title}
    >
      {/* Stage */}
      <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        {scale > 0 && (
          <div style={{ width: STAGE_W * scale, height: STAGE_H * scale }} className="relative">
            <div
              style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              className="shadow-2xl shadow-black/20"
            >
              <div
                key={`${slide.id}-${index}`}
                className={cn(
                  'h-full w-full',
                  dir === 'next'
                    ? 'motion-safe:animate-deck-slide-in-right'
                    : 'motion-safe:animate-deck-slide-in-left',
                )}
              >
                <Slide slide={slide} index={index} deckAccent={deck.accent} />
              </div>
            </div>
          </div>
        )}

        {/* Tap zones (mobile / click-to-advance) */}
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={prev}
          disabled={index === 0}
          className="absolute inset-y-0 left-0 w-[18%] cursor-w-resize disabled:cursor-default"
        />
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={next}
          disabled={index === total - 1}
          className="absolute inset-y-0 right-0 w-[18%] cursor-e-resize disabled:cursor-default"
        />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
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
            onClick={prev}
            disabled={index === 0}
            aria-label="Previous slide"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[64px] text-center text-sm font-semibold tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={index === total - 1}
            aria-label="Next slide"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5"
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <span aria-live="polite" className="sr-only">
        Slide {index + 1} of {total}
      </span>
    </div>
  );
}
