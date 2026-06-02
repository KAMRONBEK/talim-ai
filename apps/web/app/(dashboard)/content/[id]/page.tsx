'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@talim/ui';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useContent } from '@/hooks/useContent';
import { useCreateQuiz, useGenerateSummary } from '@/hooks/useQuiz';

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: content, isLoading } = useContent(id);
  const createQuiz = useCreateQuiz();
  const generateSummary = useGenerateSummary();

  const handleCreateQuiz = async () => {
    const quiz = await createQuiz.mutateAsync(id);
    router.push(`/quiz/${quiz.id}`);
  };

  const handleSummary = async () => {
    const summary = await generateSummary.mutateAsync(id);
    alert(summary);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!content) {
    return <p className="text-destructive">Content not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/content" className="text-sm text-primary hover:underline">
            &larr; Back to content
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{content.title}</h1>
          <p className="text-muted-foreground">
            {content.type} &middot; {content.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSummary}
            disabled={content.status !== 'READY' || generateSummary.isPending}
          >
            {generateSummary.isPending ? 'Generating...' : 'Summary'}
          </Button>
          <Button
            onClick={handleCreateQuiz}
            disabled={content.status !== 'READY' || createQuiz.isPending}
          >
            {createQuiz.isPending ? 'Creating...' : 'Create Quiz'}
          </Button>
        </div>
      </div>

      {content.status === 'READY' ? (
        <div className="h-[600px]">
          <ChatWindow contentId={id} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your content is being processed. Refresh the page when status is READY.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
