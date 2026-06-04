'use client';

import { useMemo } from 'react';
import { ContentList } from '@/components/content/ContentList';
import { UploadCard } from '@/components/content/UploadCard';
import { useContents } from '@/hooks/useContent';
import { useDashboardSearch } from '@/contexts/dashboard-search';

export default function DashboardPage() {
  const { data: contents, isLoading } = useContents();
  const { search } = useDashboardSearch();

  const filtered = useMemo(() => {
    if (!contents) return [];
    const q = search.toLowerCase();
    if (!q) return contents;
    return contents.filter((c) => c.title.toLowerCase().includes(q));
  }, [contents, search]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kutubxonangiz</h1>
        <p className="mt-1 text-muted-foreground">
          Materiallarni yuklang va AI xulosalar, testlar va podkastlar bilan o&apos;rganing.
        </p>
      </div>
      <UploadCard />
      <div>
        <h2 className="mb-4 text-xl font-semibold">So&apos;nggi materiallar</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        ) : (
          <ContentList contents={filtered} />
        )}
      </div>
    </div>
  );
}
