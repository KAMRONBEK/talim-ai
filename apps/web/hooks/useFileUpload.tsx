'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUploadContent } from '@/hooks/useContent';
import { useLimitErrorHandler } from '@/hooks/useLimitErrorHandler';

// Only PDF is supported end-to-end (PowerPoint is rejected server-side), so keep the
// picker's accept in sync — don't invite a file type the upload will 400 on.
export const FILE_UPLOAD_ACCEPT = '.pdf';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  uploadFailedMessage?: string;
}

export function useFileUpload({ onSuccess, uploadFailedMessage }: UseFileUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadContent();
  const handleLimitError = useLimitErrorHandler();
  const t = useTranslations('content');
  const [error, setError] = useState<string | null>(null);

  const openFilePicker = () => {
    if (!uploadMutation.isPending) inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    try {
      await uploadMutation.mutateAsync(file);
      onSuccess?.();
    } catch (err) {
      // Upgradeable limits (daily upload cap, plan file cap) open the promotion
      // modal and return null; the hard 120 MB cap / other failures return an
      // inline message.
      setError(handleLimitError(err, uploadFailedMessage ?? t('uploadFailed')));
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={FILE_UPLOAD_ACCEPT}
      className="sr-only"
      disabled={uploadMutation.isPending}
      onChange={handleFileChange}
    />
  );

  return {
    fileInput,
    openFilePicker,
    isPending: uploadMutation.isPending,
    error,
  };
}
