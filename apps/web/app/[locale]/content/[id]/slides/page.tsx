'use client';

import { use, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@talim/ui';
import { Link } from '@/i18n/navigation';
import { useContent } from '@/hooks/useContent';
import { useSlides, useGenerateSlides } from '@/hooks/useSlides';
import { useAuthStore } from '@/store/useAuthStore';
import { DeckPlayer } from '@/components/deck/DeckPlayer';

function SlidesInner({ id }: { id: string }) {
  const t = useTranslations('slides');
  const tCommon = useTranslations('common');
  const isLearner = useAuthStore((s) => s.user?.role === 'TENANT_LEARNER');
  const { data: content } = useContent(id);
  const { data: deckRow, isLoading } = useSlides(id);
  const generate = useGenerateSlides(id);

  const deck = deckRow?.deck ?? null;
  const generating = generate.isPending;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card/60 px-4 py-2.5 backdrop-blur">
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
        {!isLearner && deck && (
          <Button variant="outline" size="sm" onClick={() => generate.mutate({})} disabled={generating}>
            <RefreshCw className={generating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {t('regenerate')}
          </Button>
        )}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {deck ? (
          <DeckPlayer deck={deck} />
        ) : generating ? (
          <GeneratingState message={t('generating')} hint={t('generatingHint')} />
        ) : isLoading ? (
          <CenteredMessage>{tCommon('loading')}</CenteredMessage>
        ) : isLearner ? (
          <CenteredMessage>{t('notAvailableLearner')}</CenteredMessage>
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
      <p className="text-lg font-semibold">{message}</p>
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
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-xl">
        <Sparkles className="h-10 w-10" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{body}</p>
      </div>
      <Button size="lg" onClick={onGenerate}>
        <Sparkles className="h-5 w-5" />
        {cta}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default function SlidesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <SlidesInner id={id} />
    </Suspense>
  );
}
