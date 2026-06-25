'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play } from 'lucide-react';
import type { Deck, VideoSegment } from '@talim/types';
import { Slide } from './Slide';
import { TeacherMascot } from './TeacherMascot';

const STAGE_W = 1280;
const STAGE_H = 720;

interface FullscreenEl extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}
interface FullscreenDoc extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
}

export interface NarratedVideoLabels {
  play: string;
  pause: string;
  seek: string;
  prev: string;
  next: string;
  fullscreen: string;
  exitFullscreen: string;
}

function formatTime(sec: number): string {
  const s = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? m.toString().padStart(2, '0') : m.toString();
  return `${h > 0 ? `${h}:` : ''}${mm}:${r.toString().padStart(2, '0')}`;
}

/**
 * Plays a generated "AI video" — a narrated slideshow with a real video transport
 * bar: a seekable GLOBAL timeline across all per-slide narration clips, current/
 * total time, chapter ticks, fullscreen, play/pause and prev/next chapter. The
 * animated teacher mascot lip-syncs to the live narration amplitude.
 */
export function NarratedVideoPlayer({
  deck,
  segments,
  loadAudioUrl,
  labels,
}: {
  deck: Deck;
  segments: VideoSegment[];
  loadAudioUrl: (index: number) => Promise<string>;
  labels: NarratedVideoLabels;
}) {
  const total = Math.min(deck.slides.length, segments.length);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scale, setScale] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [posSec, setPosSec] = useState(0);
  // Real per-segment audio durations (measured on loadedmetadata); seeded with
  // the server's estimates so the timeline has a scale before clips load.
  const [durations, setDurations] = useState<number[]>(() =>
    Array.from({ length: total }, (_, i) => Math.max(1, segments[i]?.durationSec ?? 1)),
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<string | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  // Web Audio graph for driving the mascot's lip-sync from live amplitude.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mascotRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback((n: number) => Math.max(0, Math.min(n, total - 1)), [total]);

  // Cumulative start time of each segment + total video duration.
  const { cumStart, totalDur } = useMemo(() => {
    const cum = [0];
    for (let i = 0; i < total; i++) cum.push((cum[i] ?? 0) + (durations[i] ?? 0));
    return { cumStart: cum, totalDur: cum[total] ?? 0 };
  }, [durations, total]);

  // Lazily build the analyser graph on first play (needs a user gesture). The
  // MediaElementSource can only be created once per <audio> element.
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // Web Audio unavailable → mascot just idles (no lip-sync), audio still plays.
    }
  }, []);

  // Scale the fixed 1280×720 canvas to fit the stage (mirrors DeckPlayer); the
  // ResizeObserver also re-fits when entering/leaving fullscreen.
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
  // changes. Segments without audio fall back to a timed advance that still moves
  // the global timeline (so the bar doesn't freeze).
  useEffect(() => {
    const seg = segments[index];
    const audio = audioRef.current;
    let cancelled = false;

    const revoke = () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };

    if (!seg || !seg.hasAudio || !audio) {
      pendingSeekRef.current = null; // can't seek a silent segment
      if (playing && seg) {
        const dur = Math.max(2, durations[index] ?? seg.durationSec);
        const start = cumStart[index] ?? 0;
        // Resume from the seeked offset (remaining-aware), not the full duration.
        let elapsed = Math.max(0, Math.min(dur, posSec - start));
        const interval = setInterval(() => {
          elapsed += 0.2;
          setPosSec(start + Math.min(dur, elapsed));
          if (elapsed >= dur) {
            clearInterval(interval);
            if (!cancelled) setIndex((i) => (i < total - 1 ? i + 1 : i));
          }
        }, 200);
        return () => {
          cancelled = true;
          clearInterval(interval);
        };
      }
      return () => {
        cancelled = true;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, total]);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      void audioCtxRef.current?.close().catch(() => undefined);
    };
  }, []);

  // Track fullscreen state (covers Esc + webkit).
  useEffect(() => {
    const doc = document as FullscreenDoc;
    const onChange = () =>
      setFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    ensureAudioGraph();
    void audioCtxRef.current?.resume().catch(() => undefined);
    setPlaying((p) => {
      const next = !p;
      if (audio) {
        if (next) void audio.play().catch(() => undefined);
        else audio.pause();
      }
      return next;
    });
  }, [ensureAudioGraph]);

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current as FullscreenEl | null;
    const doc = document as FullscreenDoc;
    if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
      void (root?.requestFullscreen?.() ?? root?.webkitRequestFullscreen?.());
    } else {
      void (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
    }
  }, []);

  // Seek to an absolute time on the global timeline → resolve to a segment +
  // within-segment offset, switching clips if needed.
  const seekToGlobal = useCallback(
    (t: number) => {
      const target = Math.max(0, Math.min(t, totalDur));
      let idx = total - 1;
      let offset = durations[idx] ?? 0;
      for (let i = 0; i < total; i++) {
        if (target < (cumStart[i + 1] ?? 0)) {
          idx = i;
          offset = Math.max(0, target - (cumStart[i] ?? 0));
          break;
        }
      }
      setPosSec(target);
      const audio = audioRef.current;
      // Only set currentTime directly when this clip's media is actually loaded;
      // otherwise stash the offset so onLoadedMetadata applies it once it loads.
      if (idx === index && audio && audio.readyState >= 1 && Number.isFinite(audio.duration)) {
        audio.currentTime = offset;
      } else {
        pendingSeekRef.current = offset;
        if (idx !== index) setIndex(idx);
      }
    },
    [cumStart, durations, index, total, totalDur],
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || totalDur <= 0) return;
      const rect = el.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekToGlobal(frac * totalDur);
    },
    [seekToGlobal, totalDur],
  );

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    setScrubbing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onTrackPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubbing) seekFromClientX(e.clientX);
  };
  const onTrackPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    setScrubbing(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const jumpToChapter = (target: number) => {
    const t = clamp(target);
    pendingSeekRef.current = null;
    setPosSec(cumStart[t] ?? 0);
    setIndex(t);
  };

  // Mascot mouth from the narration's RMS amplitude each frame (CSS var, no re-render).
  useEffect(() => {
    const setMouth = (v: number) => mascotRef.current?.style.setProperty('--mouth', v.toFixed(3));
    if (!playing) {
      setMouth(0.1);
      return;
    }
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    let smooth = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = ((buf[i] ?? 128) - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const targetMouth = Math.min(1, rms * 3.2);
      smooth += (targetMouth - smooth) * 0.35;
      setMouth(0.1 + smooth * 0.9);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const slide = deck.slides[index];
  if (!slide || total === 0) return null;
  const posFrac = totalDur > 0 ? Math.max(0, Math.min(1, posSec / totalDur)) : 0;
  const timeLabel = `${formatTime(posSec)} / ${formatTime(totalDur)}`;

  return (
    <div ref={rootRef} className="relative flex h-full w-full flex-col bg-zinc-100 dark:bg-zinc-950">
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

        {/* Animated teacher narrator — lip-syncs to the narration audio. */}
        <div
          ref={mascotRef}
          className="pointer-events-none absolute bottom-2 left-2 z-10 h-24 w-24 sm:bottom-4 sm:left-4 sm:h-36 sm:w-36"
          style={{ ['--mouth' as string]: 0.1 } as CSSProperties}
        >
          <TeacherMascot speaking={playing} />
        </div>
      </div>

      <audio
        ref={audioRef}
        className="hidden"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          const d = audio.duration;
          if (Number.isFinite(d) && d > 0) {
            setDurations((prev) => {
              if (Math.abs((prev[index] ?? 0) - d) < 0.05) return prev;
              const next = [...prev];
              next[index] = d;
              return next;
            });
          }
          if (pendingSeekRef.current != null) {
            audio.currentTime = pendingSeekRef.current;
            pendingSeekRef.current = null;
          }
        }}
        onTimeUpdate={(e) => {
          if (scrubbing) return;
          setPosSec((cumStart[index] ?? 0) + e.currentTarget.currentTime);
        }}
        onEnded={() => {
          if (index < total - 1) setIndex(index + 1);
          else {
            setPlaying(false);
            setPosSec(totalDur); // pin the playhead to the very end
          }
        }}
      />

      {/* Seekable global timeline */}
      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        className="group relative h-4 w-full cursor-pointer touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--slide-accent,theme(colors.primary.DEFAULT))]"
        role="slider"
        aria-label={labels.seek}
        aria-valuemin={0}
        aria-valuemax={Math.round(totalDur)}
        aria-valuenow={Math.round(posSec)}
        aria-valuetext={timeLabel}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            seekToGlobal(posSec - 5);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            seekToGlobal(posSec + 5);
          }
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-300 transition-[height] group-hover:h-2 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-[var(--slide-accent,theme(colors.primary.DEFAULT))]"
            style={{ width: `${posFrac * 100}%` }}
          />
          {/* chapter boundary ticks */}
          {totalDur > 0 &&
            cumStart.slice(1, total).map((t, i) => (
              <span
                key={i}
                className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-foreground/30"
                style={{ left: `${(t / totalDur) * 100}%` }}
              />
            ))}
          {/* thumb */}
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-[var(--slide-accent,theme(colors.primary.DEFAULT))] opacity-0 shadow ring-2 ring-background transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            style={{ left: `${posFrac * 100}%`, opacity: scrubbing ? 1 : undefined }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 border-t bg-card/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => jumpToChapter(index - 1)}
            disabled={index === 0}
            aria-label={labels.prev}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? labels.pause : labels.play}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-white shadow-soft transition-transform duration-150 hover:-translate-y-0.5"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
          </button>
          <button
            type="button"
            onClick={() => jumpToChapter(index + 1)}
            disabled={index === total - 1}
            aria-label={labels.next}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="ml-1 text-sm font-medium tabular-nums text-muted-foreground">{timeLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold tabular-nums text-muted-foreground sm:inline">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-transform duration-150 hover:-translate-y-0.5"
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
