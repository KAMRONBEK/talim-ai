'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import { useQuiz, useSubmitQuiz, useLatestQuizAttempt } from '@/hooks/useQuiz';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { AuthGuard } from '@/components/auth-guard';
import { useContent } from '@/hooks/useContent';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('quiz');
  const tContent = useTranslations('content');
  const { data: quiz, isLoading } = useQuiz(id, 3000);
  const { data: latestAttemptData, isLoading: attemptLoading } = useLatestQuizAttempt(id);
  const submitQuiz = useSubmitQuiz();
  const [retaking, setRetaking] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);
  const contentId = quiz?.contentId ?? '';
  const { data: content } = useContent(contentId);

  const handleSubmit = async (answers: Record<string, string>) => {
    await submitQuiz.mutateAsync({ quizId: id, answers, contentId });
    setRetaking(false);
  };

  if (isLoading || attemptLoading) {
    return (
      <AuthGuard>
        <p className="p-8 text-muted-foreground">{t('loading')}</p>
      </AuthGuard>
    );
  }

  if (!quiz) {
    return (
      <AuthGuard>
        <p className="p-8 text-destructive">{t('notFound')}</p>
      </AuthGuard>
    );
  }

  const questionCount = quiz.questions?.length ?? 0;
  const title = content?.title ?? t('defaultTitle');
  const quizLabel = quiz.kind === 'QUICK' ? t('quickLabel') : t('fullLabel');

  const resultData = submitQuiz.data ?? latestAttemptData;
  const showResult = !retaking && resultData?.attempt != null;

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        {content && <LearningTopbar contentId={contentId} title={title} />}
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <Link
            href={contentId ? `/content/${contentId}` : '/dashboard'}
            className="mb-6 inline-block text-sm text-primary hover:underline"
          >
            ← {tContent('backToContent')}
          </Link>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{quizLabel}</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {questionCount > 0
              ? t('questionCount', { count: questionCount })
              : t('generatingQuestions')}
          </p>
          {showResult && resultData.attempt ? (
            <QuizResult
              score={resultData.attempt.score}
              correct={resultData.correct ?? 0}
              total={resultData.total ?? questionCount}
              onRetry={() => {
                setRetaking(true);
                setRetakeKey((k) => k + 1);
              }}
            />
          ) : (
            <QuizCard
              key={`${id}-${retakeKey}`}
              quiz={quiz}
              onSubmit={handleSubmit}
              isSubmitting={submitQuiz.isPending}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
