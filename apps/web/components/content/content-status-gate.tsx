'use client';

import { useTranslations } from 'next-intl';
import type { Content } from '@talim/types';
import { Button } from '@talim/ui';
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
        <div className="max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
            <span className="animate-pulse">⏳</span>
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold">{t('processing')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('processingDesc', { status: content.status })}
          </p>
          {!isLearner && (
            <div className="mt-6">
              <Button variant="outline" type="button" onClick={() => setDeleteOpen(true)}>
                {tCommon('delete')}
              </Button>
            </div>
          )}
        </div>
      </div>
      {deleteDialog}
    </>
  );
}
