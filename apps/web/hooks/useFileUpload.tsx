'use client';

import { useRef, useState } from 'react';
import { useUploadContent } from '@/hooks/useContent';

export const FILE_UPLOAD_ACCEPT = '.pdf,.ppt,.pptx';

interface UseFileUploadOptions {
  onSuccess?: () => void;
}

export function useFileUpload({ onSuccess }: UseFileUploadOptions = {}) {
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
      setError("Yuklash amalga oshmadi. Qayta urinib ko'ring.");
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
