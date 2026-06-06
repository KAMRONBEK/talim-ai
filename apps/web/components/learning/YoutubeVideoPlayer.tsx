'use client';

import { useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: () => void;
          };
        },
      ) => YoutubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YoutubePlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

interface YoutubeVideoPlayerProps {
  videoId: string;
  seekMs?: number | null;
  seekKey?: number | null;
  onTimeChange?: (timeMs: number) => void;
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export function YoutubeVideoPlayer({ videoId, seekMs, seekKey, onTimeChange }: YoutubeVideoPlayerProps) {
  const reactId = useId();
  const elementId = `youtube-player-${reactId.replace(/:/g, '')}`;
  const playerRef = useRef<YoutubePlayer | null>(null);
  const lastSeekKeyRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) setIsReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      setIsReady(false);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [elementId, videoId]);

  useEffect(() => {
    if (!isReady || seekMs == null || seekKey == null || lastSeekKeyRef.current === seekKey) return;
    lastSeekKeyRef.current = seekKey;
    playerRef.current?.seekTo(seekMs / 1000, true);
  }, [isReady, seekKey, seekMs]);

  useEffect(() => {
    if (!isReady || !onTimeChange) return;
    const interval = window.setInterval(() => {
      const seconds = playerRef.current?.getCurrentTime();
      if (typeof seconds === 'number') onTimeChange(Math.round(seconds * 1000));
    }, 200);
    return () => window.clearInterval(interval);
  }, [isReady, onTimeChange]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <div id={elementId} className="h-full w-full" />
    </div>
  );
}
