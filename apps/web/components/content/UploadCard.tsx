'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@talim/ui';
import { useUploadContent, useCreateYoutubeContent } from '@/hooks/useContent';

export function UploadCard() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const uploadMutation = useUploadContent();
  const youtubeMutation = useCreateYoutubeContent();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMutation.mutateAsync(file);
    e.target.value = '';
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    await youtubeMutation.mutateAsync({ url: youtubeUrl.trim() });
    setYoutubeUrl('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">PDF or Slides</label>
          <Input type="file" accept=".pdf,.ppt,.pptx" onChange={handleFileChange} />
          {uploadMutation.isPending && (
            <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>
          )}
        </div>
        <form onSubmit={handleYoutubeSubmit} className="space-y-2">
          <label className="block text-sm font-medium">YouTube URL</label>
          <div className="flex gap-2">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <Button type="submit" disabled={youtubeMutation.isPending}>
              Add
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
