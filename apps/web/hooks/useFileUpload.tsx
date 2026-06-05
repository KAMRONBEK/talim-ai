'use client';

import { useRef, useState } from 'react';
import { useUploadContent } from '@/hooks/useContent';

export const FILE_UPLOAD_ACCEPT = '.pdf,.ppt,.pptx';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  uploadFailedMessage?: string;
}

export function useFileUpload({ onSuccess, uploadFailedMessage }: UseFileUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadContent();
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
    } catch {
      setError(uploadFailedMessage ?? 'Upload failed');
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
