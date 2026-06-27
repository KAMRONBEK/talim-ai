'use client';

import { use, Suspense, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Button, cn } from '@talim/ui';
import { Link } from '@/i18n/navigation';
import { useContent } from '@/hooks/useContent';
import { useSections } from '@/hooks/useSections';
import { useSlides } from '@/hooks/useSlides';
import { useVideo, useGenerateVideo } from '@/hooks/useVideo';
import { useContentBase } from '@/hooks/useContentBase';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';
import { useAuthStore } from '@/store/useAuthStore';
import { NarratedVideoPlayer } from '@/components/deck/NarratedVideoPlayer';

function VideoInner({ id }: { id: string }) {
  const t = useTranslations('video');
  const tCommon = useTranslations('common');
  const isLearner = useAuthStore((s) => s.user?.role === 'TENANT_LEARNER');
  const base = useContentBase();
  const { data: content } = useContent(id);
  const { data: sections = [] } = useSections(id);
  // Each section is a video "part", generated on demand (a 200-page book can't fit
  // in one ~22-slide video). Default to the first section; the parts bar switches.
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);
  const sectionId = activeSectionId ?? sections[0]?.id;
  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === sectionId));
  const activeSection = sections[activeIndex];
  const hasParts = sections.length > 1;

  const { data: deckRow } = useSlides(id, sectionId);
  const { data: video, isLoading } = useVideo(id, sectionId);
  const generate = useGenerateVideo(id, sectionId);
  const handleLimitError = useLimitErrorHandler();
  // Upgradeable quota errors open the promotion modal (genError stays null);
  // tenant/at-cap/other failures fall back to an inline message.
  const [genError, setGenError] = useState<string | null>(null);
  const runGenerate = (input: { regenerate?: boolean }) => {
    setGenError(null);
    generate.mutate(input, { onError: (err) => setGenError(handleLimitError(err, t('error'))) });
  };

  const deck = deckRow?.deck ?? null;
  const segments = video?.segments ?? null;
  const generating =
    generate.isPending || video?.status === 'GENERATING' || video?.status === 'PENDING';
  const ready = video?.status === 'READY' && !!segments?.length && !!deck;
  // The video is finished but its slide deck hasn't loaded yet (still fetching) —
  // show "preparing visuals", never the "Generate" empty state, so a generated
  // video never looks like it doesn't exist.
  const readyAwaitingDeck = video?.status === 'READY' && !!segments?.length && !deck;

  // Pin the request to the video's own locale AND part (sectionId). fetchAuthenticatedBlob
  // uses a raw fetch (not the axios client) so it doesn't send our locale param, and the
  // segment audio is resolved per (locale, scopeKey=sectionId).
  const audioLocale = video?.locale;
  const loadAudioUrl = useCallback(
    (index: number) => {
      const qs = new URLSearchParams();
      if (audioLocale) qs.set('locale', audioLocale);
      if (sectionId) qs.set('sectionId', sectionId);
      const q = qs.toString();
      return fetchAuthenticatedBlob(`${base}/${id}/video/segments/${index}/audio${q ? `?${q}` : ''}`);
    },
    [base, id, audioLocale, sectionId],
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
            <p className="truncate text-sm font-semibold">
              {hasParts && activeSection
                ? `${t('part', { n: activeIndex + 1 })} · ${activeSection.title}`
                : (content?.title ?? tCommon('loading'))}
            </p>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* When a video already exists the EmptyState (which renders genError)
              isn't shown, so surface regenerate errors here too. */}
          {genError && ready && (
            <span className="max-w-[16rem] truncate text-sm text-destructive" title={genError}>
              {genError}
            </span>
          )}
          {!isLearner && ready && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => runGenerate({ regenerate: true })}
              disabled={generating}
            >
              <RefreshCw className={generating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {t('regenerate')}
            </Button>
          )}
        </div>
      </header>

      {/* Per-section parts selector — each section is a video "part", generated on demand. */}
      {hasParts && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border/70 bg-card/40 px-4 py-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSectionId(s.id)}
              title={s.title}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                s.id === sectionId
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:text-foreground',
              )}
            >
              {t('part', { n: i + 1 })}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {ready && deck && segments ? (
          <NarratedVideoPlayer
            key={sectionId}
            deck={deck}
            segments={segments}
            loadAudioUrl={loadAudioUrl}
            labels={{
              play: t('play'),
              pause: t('pause'),
              seek: t('seek'),
              prev: t('prevChapter'),
              next: t('nextChapter'),
              fullscreen: t('fullscreen'),
              exitFullscreen: t('exitFullscreen'),
            }}
          />
        ) : readyAwaitingDeck ? (
          <GeneratingState message={t('preparingVisuals')} hint={t('preparingVisualsHint')} />
        ) : generating ? (
          <GeneratingState message={t('generating')} hint={t('generatingHint')} />
        ) : isLoading ? (
          <CenteredMessage>{tCommon('loading')}</CenteredMessage>
        ) : isLearner ? (
          <CenteredMessage>{t('notAvailableLearner')}</CenteredMessage>
        ) : (
          <EmptyState
            title={hasParts ? t('partEmptyTitle', { n: activeIndex + 1 }) : t('emptyTitle')}
            body={hasParts ? t('partEmptyBody') : t('emptyBody')}
            cta={hasParts ? t('generatePart') : t('generate')}
            onGenerate={() => runGenerate({})}
            error={genError}
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
