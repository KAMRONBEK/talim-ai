'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import { useQuiz, useSubmitQuiz } from '@/hooks/useQuiz';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quiz } = useQuiz(id, 3000);
  const submitQuiz = useSubmitQuiz();
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(
    null,
  );

  const handleSubmit = async (answers: Record<string, string>) => {
    const data = await submitQuiz.mutateAsync({ quizId: id, answers });
    setResult({ score: data.attempt.score, correct: data.correct, total: data.total });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/content" className="text-sm text-primary hover:underline">
        &larr; Back to content
      </Link>
      <h1 className="text-3xl font-bold">Quiz</h1>
      {result ? (
        <QuizResult score={result.score} correct={result.correct} total={result.total} />
      ) : quiz ? (
        <QuizCard quiz={quiz} onSubmit={handleSubmit} isSubmitting={submitQuiz.isPending} />
      ) : (
        <p className="text-muted-foreground">Loading quiz...</p>
      )}
    </div>
  );
}
