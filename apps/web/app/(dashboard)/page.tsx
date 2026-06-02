'use client';

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@talim/ui';
import { useContents } from '@/hooks/useContent';
import { ContentList } from '@/components/content/ContentList';
import { UploadCard } from '@/components/content/UploadCard';

export default function DashboardPage() {
  const { data: contents = [], isLoading } = useContents();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Learn anything from your uploaded content</p>
        </div>
        <Link href="/content">
          <Button variant="outline">View All Content</Button>
        </Link>
      </div>

      <UploadCard />

      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <ContentList contents={contents.slice(0, 6)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
