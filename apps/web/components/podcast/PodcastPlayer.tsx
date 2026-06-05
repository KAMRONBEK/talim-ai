'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@talim/ui';

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
}

export function PodcastPlayer({
  audioUrl,
  playbackRate,
  onPlaybackRateChange,
  initialPositionSec = 0,
  onProgress,
}: PodcastPlayerProps) {
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
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={duration || 1}
        value={current}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
        onChange={(e) => {
          const t = Number(e.target.value);
          if (audioRef.current) audioRef.current.currentTime = t;
          setCurrent(t);
          reportProgress(t, duration);
        }}
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
        <span className="text-muted-foreground">Tezlik:</span>
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
    </div>
  );
}
