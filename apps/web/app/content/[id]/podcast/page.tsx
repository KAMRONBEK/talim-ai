'use client';

import { use, useEffect, useState, Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@talim/ui';
import { useContent } from '@/hooks/useContent';
import { usePodcast, useCreatePodcast } from '@/hooks/usePodcast';
import { usePodcastProgress, useUpdatePodcastProgress } from '@/hooks/useProgress';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { PodcastPlayer } from '@/components/podcast/PodcastPlayer';
import type { PodcastEpisode } from '@talim/types';

function formatDuration(sec: number | null): string {
  if (!sec) return '--:--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PodcastPageInner({ id }: { id: string }) {
  const { data: content } = useContent(id);
  const { data: podcast, isLoading } = usePodcast(id, 3000);
  const createPodcast = useCreatePodcast();
  const { data: progressList = [] } = usePodcastProgress(id);
  const updateProgress = useUpdatePodcastProgress(id);
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const lastSavedRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressRef = useRef<{
    episodeId: string;
    listenedSec: number;
    completed: boolean;
  } | null>(null);
  const progressMap = new Map(progressList.map((p) => [p.episodeId, p]));
  const activeProgress = activeEpisode ? progressMap.get(activeEpisode.id) : undefined;

  const flushProgress = useCallback(() => {
    const pending = pendingProgressRef.current;
    if (!pending) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    lastSavedRef.current = pending.listenedSec;
    pendingProgressRef.current = null;
    updateProgress.mutate(pending);
  }, [updateProgress]);

  const handleProgress = useCallback(
    (listenedSec: number, completed: boolean) => {
      if (!activeEpisode) return;

      if (completed) {
        pendingProgressRef.current = {
          episodeId: activeEpisode.id,
          listenedSec,
          completed: true,
        };
        flushProgress();
        return;
      }

      if (Math.abs(listenedSec - lastSavedRef.current) < 5) return;

      pendingProgressRef.current = {
        episodeId: activeEpisode.id,
        listenedSec,
        completed: false,
      };

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushProgress, 2000);
    },
    [activeEpisode, flushProgress],
  );

  useEffect(() => {
    return () => {
      flushProgress();
    };
  }, [flushProgress]);

  useEffect(() => {
    if (!activeEpisode?.hasAudio) {
      setAudioUrl(null);
      return;
    }
    let revoked: string | null = null;
    lastSavedRef.current = 0;
    pendingProgressRef.current = null;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    fetchAuthenticatedBlob(`/content/${id}/podcast/episodes/${activeEpisode.id}/audio`)
      .then((url) => {
        revoked = url;
        setAudioUrl(url);
      })
      .catch(() => setAudioUrl(null));
    return () => {
      flushProgress();
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [activeEpisode, id, flushProgress]);

  useEffect(() => {
    const ready = podcast?.episodes.filter((e) => e.hasAudio) ?? [];
    if (!activeEpisode && ready.length > 0) {
      setActiveEpisode(ready[0] ?? null);
    }
  }, [podcast, activeEpisode]);

  if (!content) return <p className="p-8">Yuklanmoqda...</p>;

  if (content.status !== 'READY') {
    return (
      <p className="p-8 text-muted-foreground">
        Podkast yaratish uchun material tayyor bo&apos;lishi kerak.
      </p>
    );
  }

  if (!podcast && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-xl font-semibold">Hali podkast yo&apos;q</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Kontent bo&apos;laklaridan AI ovozli podkast yarating.
        </p>
        <Button onClick={() => createPodcast.mutate(id)} disabled={createPodcast.isPending}>
          {createPodcast.isPending ? 'Boshlanmoqda...' : 'Podkast yaratish'}
        </Button>
      </div>
    );
  }

  const episodes = podcast?.episodes ?? [];
  const generating = podcast?.status === 'GENERATING' || podcast?.status === 'PENDING';

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-80 shrink-0 overflow-y-auto border-r bg-card">
        <div className="border-b p-5">
          <h2 className="text-[15px] font-semibold">{content.title}</h2>
          <p className="text-xs text-muted-foreground">
            {episodes.length} epizod
            {generating && ' · Yaratilmoqda...'}
          </p>
        </div>
        <div className="space-y-1 p-3">
          {episodes.map((ep, i) => {
            const epProgress = progressMap.get(ep.id);
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => setActiveEpisode(ep)}
                className={`flex w-full items-center gap-3 rounded-[10px] p-3 text-left text-sm transition-colors ${
                  activeEpisode?.id === ep.id ? 'bg-accent' : 'hover:bg-muted/60'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                    activeEpisode?.id === ep.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ep.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDuration(ep.durationSec)}
                    {!ep.hasAudio && ' · Tayyorlanmoqda'}
                    {epProgress?.completed && ' · Tugallangan'}
                  </p>
                </div>
                {ep.hasAudio && (
                  <span className="shrink-0 text-[11px] font-medium text-success">Tayyor</span>
                )}
              </button>
            );
          })}
        </div>
        {generating && (
          <div className="px-3 pb-3">
            <Button className="w-full" variant="outline" disabled>
              Epizodlar yaratilmoqda...
            </Button>
          </div>
        )}
      </aside>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-10">
        {activeEpisode ? (
          <>
            <div className="relative flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-success-muted to-info-muted text-7xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-none">
              🎧
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold">{activeEpisode.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{content.title}</p>
            </div>
            {audioUrl ? (
              <PodcastPlayer
                audioUrl={audioUrl}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                initialPositionSec={activeProgress?.listenedSec ?? 0}
                onProgress={handleProgress}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Ushbu epizod uchun audio hali tayyor emas.</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Epizod tanlang</p>
        )}
        <Link href={`/content/${id}`} className="text-sm text-primary hover:underline">
          ← Kontentga qaytish
        </Link>
      </div>
    </div>
  );
}

export default function PodcastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<p className="p-8">Yuklanmoqda...</p>}>
      <PodcastPageInner id={id} />
    </Suspense>
  );
}
