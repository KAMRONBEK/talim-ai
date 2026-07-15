'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  buttonVariants,
  cn,
} from '@talim/ui';
import { useCreateYoutubeContent } from '@/hooks/useContent';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

interface UploadCallbacks {
  onSuccess?: () => void;
}

function FileUploadField({ onSuccess }: UploadCallbacks) {
  const t = useTranslations('content');
  const tCommon = useTranslations('common');
  // Plan/quota limits surface the global promotion modal from inside the hook;
  // `error` only carries the inline fallbacks (hard cap / generic failure).
  const { fileInput, openFilePicker, isPending, error } = useFileUpload({
    onSuccess,
    uploadFailedMessage: t('uploadFailed'),
  });

  return (
    <div>
      {fileInput}
      <p className="mb-2 text-sm font-medium">{t('pdfOrSlides')}</p>
      <button
        type="button"
        disabled={isPending}
        onClick={openFilePicker}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex h-10 w-full touch-manipulation select-none items-center justify-center',
        )}
      >
        {isPending ? tCommon('uploading') : t('selectFile')}
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function YoutubeLinkForm({ onSuccess }: UploadCallbacks) {
  const t = useTranslations('content');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const youtubeMutation = useCreateYoutubeContent();
  const handleLimitError = useLimitErrorHandler();

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setError(null);
    try {
      await youtubeMutation.mutateAsync({ url: youtubeUrl.trim() });
      setYoutubeUrl('');
      onSuccess?.();
    } catch (err) {
      // A daily upload/generation quota opens the promotion modal; other failures
      // show the inline link error.
      setError(handleLimitError(err, t('linkFailed')));
    }
  };

  return (
    <form onSubmit={handleYoutubeSubmit} className="space-y-2">
      <label className="block text-sm font-medium">{t('youtubeLink')}</label>
      <div className="flex gap-2">
        <Input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          disabled={youtubeMutation.isPending}
        />
        <Button type="submit" className="touch-manipulation" disabled={youtubeMutation.isPending}>
          {youtubeMutation.isPending ? '...' : t('addLink')}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

interface UploadCardProps {
  onSuccess?: () => void;
  compact?: boolean;
}

function UploadCard({ onSuccess, compact }: UploadCardProps) {
  const t = useTranslations('content');
  const inner = (
    <>
      <FileUploadField onSuccess={onSuccess} />
      <YoutubeLinkForm onSuccess={onSuccess} />
    </>
  );

  if (compact) {
    return <div className="space-y-4">{inner}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('uploadMaterial')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{inner}</CardContent>
    </Card>
  );
}
