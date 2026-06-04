'use client';

import { useRef, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@talim/ui';
import { useUploadContent, useCreateYoutubeContent } from '@/hooks/useContent';

interface UploadCallbacks {
  onSuccess?: () => void;
}

export function FileUploadField({ onSuccess }: UploadCallbacks) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadContent();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMutation.mutateAsync(file);
    e.target.value = '';
    onSuccess?.();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ppt,.pptx"
        className="hidden"
        onChange={handleFileChange}
      />
      <label className="mb-2 block text-sm font-medium">PDF yoki slaydlar</label>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending ? 'Yuklanmoqda...' : 'Fayl tanlash'}
      </Button>
    </div>
  );
}

export function YoutubeLinkForm({ onSuccess }: UploadCallbacks) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const youtubeMutation = useCreateYoutubeContent();

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    await youtubeMutation.mutateAsync({ url: youtubeUrl.trim() });
    setYoutubeUrl('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleYoutubeSubmit} className="space-y-2">
      <label className="block text-sm font-medium">YouTube havolasi</label>
      <div className="flex gap-2">
        <Input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
        <Button type="submit" disabled={youtubeMutation.isPending}>
          {youtubeMutation.isPending ? '...' : "Qo'shish"}
        </Button>
      </div>
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
