'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUp, Link2 } from 'lucide-react';
import {
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@talim/ui';
import { YoutubeLinkForm } from '@/components/content/UploadCard';
import { useFileUpload } from '@/hooks/useFileUpload';

export function QuickActionCards() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [linkOpen, setLinkOpen] = useState(false);
  const { fileInput, openFilePicker, isPending, error } = useFileUpload();

  return (
    <>
      {fileInput}
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={isPending}
          onClick={openFilePicker}
          className={cn(
            'dashboard-card group flex touch-manipulation flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all',
            'hover:border-primary/30 hover:shadow-md',
            isPending && 'pointer-events-none opacity-60',
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">
              {isPending ? tCommon('uploading') : t('uploadTitle')}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('uploadDesc')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLinkOpen(true)}
          className={cn(
            'dashboard-card group flex touch-manipulation flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all',
            'hover:border-primary/30 hover:shadow-md',
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{t('linkTitle')}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('linkDesc')}</p>
          </div>
        </button>
      </div>

      {error && (
        <p className="mx-auto w-full max-w-2xl text-center text-sm text-destructive">{error}</p>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addViaLink')}</DialogTitle>
          </DialogHeader>
          <YoutubeLinkForm onSuccess={() => setLinkOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
