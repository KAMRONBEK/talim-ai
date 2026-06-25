'use client';

import { use, Suspense, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@talim/ui';
import { Link } from '@/i18n/navigation';
import { useContent } from '@/hooks/useContent';
import { useSlides } from '@/hooks/useSlides';
import { useVideo, useGenerateVideo } from '@/hooks/useVideo';
import { useContentBase } from '@/hooks/useContentBase';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { classifyGenerationError } from '@/lib/generation-error';
import { useAuthStore } from '@/store/useAuthStore';
import { NarratedVideoPlayer } from '@/components/deck/NarratedVideoPlayer';

function VideoInner({ id }: { id: string }) {
  const t = useTranslations('video');
  const tCommon = useTranslations('common');
  const isLearner = useAuthStore((s) => s.user?.role === 'TENANT_LEARNER');
  const base = useContentBase();
  const { data: content } = useContent(id);
  const { data: deckRow } = useSlides(id);
  const { data: video, isLoading } = useVideo(id);
  const generate = useGenerateVideo(id);

  const deck = deckRow?.deck ?? null;
  const segments = video?.segments ?? null;
  const generating =
    generate.isPending || video?.status === 'GENERATING' || video?.status === 'PENDING';
  const ready = video?.status === 'READY' && !!segments?.length && !!deck;
  // The video is finished but its slide deck hasn't loaded yet (still fetching) —
  // show "preparing visuals", never the "Generate" empty state, so a generated
  // video never looks like it doesn't exist.
  const readyAwaitingDeck = video?.status === 'READY' && !!segments?.length && !deck;

  const errInfo = classifyGenerationError(generate.error);
  const isLimit = generate.isError && errInfo.kind !== 'error';
  const limitMessage =
    errInfo.kind === 'quota'
      ? t('limitReached', { used: errInfo.used ?? 0, limit: errInfo.limit ?? 0 })
      : t('limitReachedGeneric');

  // Pin the request to the video's own locale. fetchAuthenticatedBlob uses a raw
  // fetch (not the axios client), so it doesn't send our locale param — without
  // this the server resolves the browser's Accept-Language (e.g. en) and 404s
  // because the video/segment audio is looked up per locale (the video is uz).
  const audioLocale = video?.locale;
  const loadAudioUrl = useCallback(
    (index: number) =>
      fetchAuthenticatedBlob(
        `${base}/${id}/video/segments/${index}/audio${audioLocale ? `?locale=${audioLocale}` : ''}`,
      ),
    [base, id, audioLocale],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/60 px-4 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/content/${id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:text-foreground"
            aria-label={tCommon('home')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{content?.title ?? tCommon('loading')}</p>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        {!isLearner && ready && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate.mutate({ regenerate: true })}
            disabled={generating}
          >
            <RefreshCw className={generating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {t('regenerate')}
          </Button>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {ready && deck && segments ? (
          <NarratedVideoPlayer
            deck={deck}
            segments={segments}
            loadAudioUrl={loadAudioUrl}
            playLabel={t('play')}
            pauseLabel={t('pause')}
          />
        ) : readyAwaitingDeck ? (
          <GeneratingState message={t('preparingVisuals')} hint={t('preparingVisualsHint')} />
        ) : generating ? (
          <GeneratingState message={t('generating')} hint={t('generatingHint')} />
        ) : isLoading ? (
          <CenteredMessage>{tCommon('loading')}</CenteredMessage>
        ) : isLearner ? (
          <CenteredMessage>{t('notAvailableLearner')}</CenteredMessage>
        ) : isLimit ? (
          <CenteredMessage>{limitMessage}</CenteredMessage>
        ) : (
          <EmptyState
            title={t('emptyTitle')}
            body={t('emptyBody')}
            cta={t('generate')}
            onGenerate={() => generate.mutate({})}
            error={generate.isError ? t('error') : null}
          />
        )}
      </div>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">{children}</div>;
}

function GeneratingState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
      </div>
      <p className="font-display text-lg font-semibold">{message}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
  onGenerate,
  error,
}: {
  title: string;
  body: string;
  cta: string;
  onGenerate: () => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-brand text-white shadow-soft">
        <Sparkles className="h-10 w-10" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{body}</p>
      </div>
      <Button variant="gradient" size="lg" onClick={onGenerate}>
        <Sparkles className="h-5 w-5" />
        {cta}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <VideoInner id={id} />
    </Suspense>
  );
}
