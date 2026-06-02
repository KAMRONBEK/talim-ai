'use client';

import { UploadCard } from '@/components/content/UploadCard';
import { ContentList } from '@/components/content/ContentList';
import { useContents } from '@/hooks/useContent';

export default function ContentPage() {
  const { data: contents = [], isLoading } = useContents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your Content</h1>
        <p className="text-muted-foreground">Upload PDFs, slides, or YouTube videos</p>
      </div>
      <UploadCard />
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <ContentList contents={contents} />
      )}
    </div>
  );
}
