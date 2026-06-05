'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@talim/ui';
import type { Content } from '@talim/types';

interface ContentListProps {
  contents: Content[];
}

const statusColors: Record<string, string> = {
  PENDING: 'text-warning',
  PROCESSING: 'text-info',
  READY: 'text-success',
  FAILED: 'text-destructive',
};

export function ContentList({ contents }: ContentListProps) {
  if (contents.length === 0) {
    return <p className="text-muted-foreground">No content yet. Upload something to get started.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contents.map((content) => (
        <Link key={content.id} href={`/content/${content.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="truncate text-base">{content.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="rounded bg-secondary px-2 py-0.5">{content.type}</span>
                <span className={statusColors[content.status] ?? ''}>{content.status}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
