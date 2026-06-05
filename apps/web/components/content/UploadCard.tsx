'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, buttonVariants, cn } from '@talim/ui';
import { useCreateYoutubeContent } from '@/hooks/useContent';
import { useFileUpload } from '@/hooks/useFileUpload';

interface UploadCallbacks {
  onSuccess?: () => void;
}

export function FileUploadField({ onSuccess }: UploadCallbacks) {
  const { fileInput, openFilePicker, isPending, error } = useFileUpload({ onSuccess });

  return (
    <div>
      {fileInput}
      <p className="mb-2 text-sm font-medium">PDF yoki slaydlar</p>
      <button
        type="button"
        disabled={isPending}
        onClick={openFilePicker}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex h-10 w-full touch-manipulation select-none items-center justify-center',
        )}
      >
        {isPending ? 'Yuklanmoqda...' : 'Fayl tanlash'}
      </button>
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
