'use client';

import { use } from 'react';
import Link from 'next/link';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import { useQuiz, useSubmitQuiz } from '@/hooks/useQuiz';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { AuthGuard } from '@/components/auth-guard';
import { useContent } from '@/hooks/useContent';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quiz, isLoading } = useQuiz(id, 3000);
  const submitQuiz = useSubmitQuiz();
  const contentId = quiz?.contentId ?? '';
  const { data: content } = useContent(contentId);

  const handleSubmit = async (answers: Record<string, string>) => {
    await submitQuiz.mutateAsync({ quizId: id, answers });
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <p className="p-8 text-muted-foreground">Test yuklanmoqda...</p>
      </AuthGuard>
    );
  }

  if (!quiz) {
    return (
      <AuthGuard>
        <p className="p-8 text-destructive">Test topilmadi</p>
      </AuthGuard>
    );
  }

  const questionCount = quiz.questions?.length ?? 0;
  const title = content?.title ?? 'Test';

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        {content && <LearningTopbar contentId={contentId} title={title} />}
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <Link
            href={contentId ? `/content/${contentId}` : '/dashboard'}
            className="mb-6 inline-block text-sm text-primary hover:underline"
          >
            ← Kontentga qaytish
          </Link>
          <p className="mb-4 text-sm text-muted-foreground">
            {questionCount > 0 ? `${questionCount} ta savol` : 'Savollar yaratilmoqda...'}
          </p>
          {submitQuiz.data ? (
            <QuizResult
              score={submitQuiz.data.attempt.score}
              correct={submitQuiz.data.correct}
              total={submitQuiz.data.total}
            />
          ) : (
            <QuizCard quiz={quiz} onSubmit={handleSubmit} isSubmitting={submitQuiz.isPending} />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
