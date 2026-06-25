'use client';

import { use, useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
import { useContent } from '@/hooks/useContent';
import { useAuthStore } from '@/store/useAuthStore';
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
  const t = useTranslations('content');
  const tCommon = useTranslations('common');
  const { data: content } = useContent(id);
  const isLearner = useAuthStore((s) => s.user?.role) === 'TENANT_LEARNER';
  const isTenantOwner = useAuthStore((s) => s.user?.role) === 'TENANT_OWNER';
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

  // Stable ref to the latest flushProgress so cleanup-only effects don't list
  // it as a dependency. flushProgress changes identity every render (it closes
  // over the react-query mutation object), so depending on it re-runs effects
  // on every render.
  const flushProgressRef = useRef(flushProgress);
  useEffect(() => {
    flushProgressRef.current = flushProgress;
  }, [flushProgress]);

  useEffect(() => {
    return () => {
      flushProgressRef.current();
    };
  }, []);

  // Only (re)fetch the audio blob when the episode that has audio actually
  // changes. Previously this depended on activeEpisode/flushProgress identity,
  // so while the podcast was still generating (3s poll → constant re-render)
  // the blob URL was revoked + recreated every render — spamming blob 404s and
  // resetting playback to 0 so it could never start.
  const audioEpisodeId = activeEpisode?.hasAudio ? activeEpisode.id : null;
  useEffect(() => {
    if (!audioEpisodeId) {
      setAudioUrl(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;
    lastSavedRef.current = 0;
    pendingProgressRef.current = null;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    fetchAuthenticatedBlob(
      `${isTenantOwner ? '/tenant/content' : '/content'}/${id}/podcast/episodes/${audioEpisodeId}/audio`,
    )
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setAudioUrl(url);
      })
      .catch(() => {
        if (!cancelled) setAudioUrl(null);
      });
    return () => {
      cancelled = true;
      flushProgressRef.current();
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [audioEpisodeId, id, isTenantOwner]);

  useEffect(() => {
    const ready = podcast?.episodes.filter((e) => e.hasAudio) ?? [];
    if (!activeEpisode && ready.length > 0) {
      setActiveEpisode(ready[0] ?? null);
    }
  }, [podcast, activeEpisode]);

  if (!content) return <p className="p-8">{tCommon('loading')}</p>;

  if (content.status !== 'READY') {
    return (
      <p className="p-8 text-muted-foreground">{t('podcastNeedsReady')}</p>
    );
  }

  if (!podcast && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-success-muted to-info-muted text-4xl shadow-soft">
          🎧
        </div>
        <h2 className="font-display text-xl font-semibold">{t('noPodcast')}</h2>
        {/* Learners cannot generate content — show an informational message
            instead of the (server-blocked) "Create podcast" action. */}
        {isLearner ? (
          <p className="max-w-md text-center text-sm text-muted-foreground">{t('podcastLearnerEmpty')}</p>
        ) : (
          <>
            <p className="max-w-md text-center text-sm text-muted-foreground">{t('noPodcastDesc')}</p>
            <Button variant="gradient" onClick={() => createPodcast.mutate({ contentId: id })} disabled={createPodcast.isPending}>
              {createPodcast.isPending ? t('podcastGenerating') : t('createPodcast')}
            </Button>
          </>
        )}
      </div>
    );
  }

  const episodes = podcast?.episodes ?? [];
  const generating = podcast?.status === 'GENERATING' || podcast?.status === 'PENDING';
  const failed = podcast?.status === 'FAILED';
  const missingAudio = episodes.some((e) => !e.hasAudio);

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="w-full shrink-0 overflow-y-auto border-b border-border/70 bg-card md:w-80 md:border-b-0 md:border-r">
        <div className="border-b border-border/70 p-4 md:p-5">
          <h2 className="font-display text-[15px] font-semibold">{content.title}</h2>
          <p className="text-xs text-muted-foreground">
            {t('episodes', { count: episodes.length })}
            {generating && ` · ${t('podcastGenerating')}`}
            {failed && ` · ${t('podcastFailed')}`}
          </p>
          {!isLearner && (failed || (generating && missingAudio) || (!generating && missingAudio)) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              disabled={createPodcast.isPending}
              onClick={() => createPodcast.mutate({ contentId: id, regenerate: true })}
            >
              {createPodcast.isPending ? t('podcastGenerating') : t('retryPodcast')}
            </Button>
          )}
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
                    {!ep.hasAudio && ` · ${t('episodePreparing')}`}
                    {epProgress?.completed && ` · ${t('episodeCompleted')}`}
                  </p>
                </div>
                {ep.hasAudio && (
                  <span className="shrink-0 text-[11px] font-medium text-success">{t('episodeReady')}</span>
                )}
              </button>
            );
          })}
        </div>
        {generating && (
          <div className="px-3 pb-3">
            <Button className="w-full" variant="outline" disabled>
              {t('episodesGenerating')}
            </Button>
          </div>
        )}
      </aside>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-4 md:gap-8 md:p-10">
        {activeEpisode ? (
          <>
            <div className="relative flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-success-muted to-info-muted text-6xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-none md:h-[280px] md:w-[280px] md:text-7xl">
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
              <p className="text-sm text-muted-foreground">{t('audioNotReady')}</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">{t('selectEpisode')}</p>
        )}
        <Link href={`/content/${id}`} className="text-sm text-primary hover:underline">
          ← {t('backToContent')}
        </Link>
      </div>
    </div>
  );
}

export default function PodcastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<p className="p-8">...</p>}>
      <PodcastPageInner id={id} />
    </Suspense>
  );
}
