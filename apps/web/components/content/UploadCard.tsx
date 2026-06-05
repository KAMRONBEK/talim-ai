'use client';

import { useId, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, buttonVariants, cn } from '@talim/ui';
import { useUploadContent, useCreateYoutubeContent } from '@/hooks/useContent';

interface UploadCallbacks {
  onSuccess?: () => void;
}

export function FileUploadField({ onSuccess }: UploadCallbacks) {
  const inputId = useId();
  const uploadMutation = useUploadContent();
  const [error, setError] = useState<string | null>(null);

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

  const isPending = uploadMutation.isPending;

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept=".pdf,.ppt,.pptx"
        className="sr-only"
        disabled={isPending}
        onChange={handleFileChange}
      />
      <p className="mb-2 text-sm font-medium">PDF yoki slaydlar</p>
      <label
        htmlFor={isPending ? undefined : inputId}
        aria-disabled={isPending}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex h-10 w-full cursor-pointer touch-manipulation select-none items-center justify-center',
          isPending && 'pointer-events-none opacity-50',
        )}
      >
        {isPending ? 'Yuklanmoqda...' : 'Fayl tanlash'}
      </label>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function YoutubeLinkForm({ onSuccess }: UploadCallbacks) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const youtubeMutation = useCreateYoutubeContent();

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setError(null);
    try {
      await youtubeMutation.mutateAsync({ url: youtubeUrl.trim() });
      setYoutubeUrl('');
      onSuccess?.();
    } catch {
      setError("Havola qo'shilmadi. URL ni tekshirib qayta urinib ko'ring.");
    }
  };

  return (
    <form onSubmit={handleYoutubeSubmit} className="space-y-2">
      <label className="block text-sm font-medium">YouTube havolasi</label>
      <div className="flex gap-2">
        <Input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          disabled={youtubeMutation.isPending}
        />
        <Button type="submit" className="touch-manipulation" disabled={youtubeMutation.isPending}>
          {youtubeMutation.isPending ? '...' : "Qo'shish"}
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

export function UploadCard({ onSuccess, compact }: UploadCardProps) {
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
        <CardTitle>Material yuklash</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{inner}</CardContent>
    </Card>
  );
}
