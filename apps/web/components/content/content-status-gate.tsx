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
          <div className="max-w-md rounded-xl border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">{t('failed')}</h2>
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
        <div className="max-w-md rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">{t('processing')}</h2>
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
