'use client';

import { useRef, useState } from 'react';
import type { PlanFileLimitResponse } from '@talim/types';
import { useUploadContent } from '@/hooks/useContent';

export const FILE_UPLOAD_ACCEPT = '.pdf,.ppt,.pptx';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  uploadFailedMessage?: string;
}

function asPlanFileLimit(err: unknown): PlanFileLimitResponse | null {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object' && (data as { code?: string }).code === 'PLAN_FILE_LIMIT') {
    return data as PlanFileLimitResponse;
  }
  return null;
}

export function useFileUpload({ onSuccess, uploadFailedMessage }: UseFileUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadContent();
  const [error, setError] = useState<string | null>(null);
  const [planLimit, setPlanLimit] = useState<PlanFileLimitResponse | null>(null);

  const openFilePicker = () => {
    if (!uploadMutation.isPending) inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setPlanLimit(null);
    try {
      await uploadMutation.mutateAsync(file);
      onSuccess?.();
    } catch (err) {
      // A plan page/size cap surfaces the upgrade modal instead of an inline error.
      const limit = asPlanFileLimit(err);
      if (limit) setPlanLimit(limit);
      else setError(uploadFailedMessage ?? 'Upload failed');
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
    planLimit,
    clearPlanLimit: () => setPlanLimit(null),
  };
}
