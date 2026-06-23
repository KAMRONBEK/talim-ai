'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, ScanLine, LayoutList } from 'lucide-react';
import type { Content } from '@talim/types';
import { Button, cn } from '@talim/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { useRetryContent } from '@/hooks/useContent';
import { DeleteContentDialog } from '@/components/content/delete-content-dialog';

interface ContentStatusGateProps {
  content: Content;
  isLearner: boolean;
  homePath: string;
  retryContent: ReturnType<typeof useRetryContent>;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
}

/**
 * Renders the FAILED / processing (non-READY) status screens for a content
 * detail page. Returns `null` when the content is READY so the caller can
 * render the full detail view. Behaviour matches the previous inline branches.
 */
export function ContentStatusGate({
  content,
  isLearner,
  homePath,
  retryContent,
  deleteOpen,
  setDeleteOpen,
}: ContentStatusGateProps) {
  const t = useTranslations('content');
  const tCommon = useTranslations('common');
  const router = useRouter();

  if (content.status === 'READY') return null;

  const deleteDialog = (
    <DeleteContentDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      content={{ id: content.id, title: content.title }}
      onDeleted={() => router.push(homePath)}
    />
  );

  if (content.status === 'FAILED') {
    return (
      <>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-2xl">⚠️</div>
            <h2 className="mt-4 font-display text-lg font-semibold">{t('failed')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('failedDesc')}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {!isLearner && (
                <>
                  <Button
                    disabled={retryContent.isPending}
                    onClick={() => retryContent.mutate(content.id)}
                  >
                    {retryContent.isPending ? t('retrying') : t('retry')}
                  </Button>
                  <Button variant="outline" type="button" onClick={() => setDeleteOpen(true)}>
                    {tCommon('delete')}
                  </Button>
                </>
              )}
              <Link href={homePath}>
                <Button variant="outline" type="button">
                  {t('backToLibrary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-1 items-center justify-center p-8">
        <ProcessingCard
          status={content.status}
          isLearner={isLearner}
          onDelete={() => setDeleteOpen(true)}
        />
      </div>
      {deleteDialog}
    </>
  );
}

/** Delightful, on-brand "we're processing your material" animation. */
function ProcessingCard({
  status,
  isLearner,
  onDelete,
}: {
  status: string;
  isLearner: boolean;
  onDelete: () => void;
}) {
  const t = useTranslations('content');
  const tCommon = useTranslations('common');

  const steps = [
    { icon: ScanLine, label: t('processingStepReading') },
    { icon: FileText, label: t('processingStepAnalyzing') },
    { icon: LayoutList, label: t('processingStepStructuring') },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % steps.length), 1900);
    return () => clearInterval(id);
  }, [steps.length]);

  const ActiveIcon = steps[active]!.icon;

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card p-8 text-center shadow-card">
      {/* ambient brand glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-girih opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

      {/* Emblem: gradient tile with pulsing rings + an orbiting accent dot. */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-[1.25rem] bg-primary/20" />
        <span className="absolute inset-1.5 animate-pulse rounded-[1.1rem] bg-primary/10" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow">
          <ActiveIcon key={active} className="h-8 w-8 animate-scale-in" />
        </div>
        <span className="absolute inset-0 animate-spin [animation-duration:3.2s]">
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent-secondary shadow-soft" />
        </span>
      </div>

      <h2 className="relative mt-5 font-display text-lg font-semibold">{t('processing')}</h2>

      {/* Cycling step label — fades in on each change. */}
      <div className="relative mt-1.5 flex h-5 items-center justify-center">
        <span key={active} className="animate-fade-in text-sm text-muted-foreground">
          {steps[active]!.label}
        </span>
      </div>

      {/* Indeterminate gradient bar. */}
      <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="animate-loading-slide absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-brand" />
      </div>

      {/* Step dots — the active one stretches into a pill. */}
      <div className="relative mt-4 flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === active ? 'w-6 bg-primary' : 'w-1.5 bg-border',
            )}
          />
        ))}
      </div>

      <p className="relative mt-4 text-xs text-muted-foreground">
        {t('processingDesc', { status })}
      </p>

      {!isLearner && (
        <div className="relative mt-6">
          <Button variant="outline" size="sm" type="button" onClick={onDelete}>
            {tCommon('delete')}
          </Button>
        </div>
      )}
    </div>
  );
}
