'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Check, ChevronLeft, X } from 'lucide-react';
import { Badge, Button, Card, CardContent } from '@talim/ui';
import {
  gradeQuestion,
  MASTERY_BAND_ORDER,
  resolveCorrectAnswer,
  type MasteryDelta,
  type Quiz,
} from '@talim/types';
import { Link } from '@/i18n/navigation';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizResult } from '@/components/quiz/QuizResult';
import {
  formatAnswerDisplay,
  gradableQuestion,
  questionTypeLabelKey,
  type QuizAnswerValue,
} from '@/components/quiz/question-inputs';
import { RichText } from '@/components/learning/rich-text';
import {
  useQuiz,
  useSubmitQuiz,
  useLatestQuizAttempt,
  isQuizGenerationStale,
} from '@/hooks/useQuiz';
import { useSections } from '@/hooks/useSections';
import { LearningTopbar } from '@/components/layout/learning-topbar';
import { AuthGuard } from '@/components/auth-guard';
import { useContent } from '@/hooks/useContent';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Post-answer option styling for the review — matches QuizCard's revealed branch. */
function getReviewOptionStyles(
  selected: boolean,
  isCorrectOption: boolean,
  isCorrect: boolean,
): { label: string; letter: string } {
  if (selected && isCorrect) {
    return {
      label: 'border-success bg-success-muted',
      letter: 'border-success bg-success text-success-foreground',
    };
  }
  if (selected && !isCorrect) {
    return {
      label: 'border-destructive bg-destructive/10',
      letter: 'border-destructive bg-destructive text-destructive-foreground',
    };
  }
  if (isCorrectOption && !isCorrect) {
    return {
      label: 'border-success bg-success-muted/80',
      letter: 'border-success bg-success text-success-foreground',
    };
  }
  return { label: 'border-border bg-muted/20 opacity-60', letter: 'border-border bg-card' };
}

/** Per-question answer review with difficulty/bloom badges and source provenance. */
function QuizReviewList({
  quiz,
  answers,
  onBack,
}: {
  quiz: Quiz;
  /** Graded attempt answers keyed by question id (structured answers arrive JSON-encoded). */
  answers: Record<string, string>;
  onBack: () => void;
}) {
  const t = useTranslations('quiz');
  const questions = quiz.questions ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('backToResults')}
        </Button>
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('reviewTitle')}
        </p>
      </div>

      {questions.map((q, index) => {
        const raw = answers[q.id] ?? '';
        // Same grading engine the server used for the attempt (JSON strings parse inside).
        const grade = gradeQuestion(gradableQuestion(q), raw, true);
        const isPartial = !grade.correct && grade.creditFraction > 0 && grade.creditFraction < 1;
        const isOptionList =
          (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') && (q.options?.length ?? 0) > 0;
        const answerText = formatAnswerDisplay(raw);
        const correctText = q.acceptableAnswers?.length
          ? q.acceptableAnswers.join(', ')
          : q.correctAnswer;

        return (
          <Card key={q.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t(questionTypeLabelKey(q.type))}
                </span>
                {q.difficulty && <Badge variant="outline">{t(`difficulty.${q.difficulty}`)}</Badge>}
                {q.bloom && <Badge variant="secondary">{t(`bloom.${q.bloom}`)}</Badge>}
                <span
                  className={`ml-auto flex items-center gap-1.5 text-sm font-semibold ${
                    grade.correct ? 'text-success' : isPartial ? 'text-warning' : 'text-destructive'
                  }`}
                >
                  {grade.correct ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <X className="h-4 w-4" strokeWidth={3} />
                  )}
                  {grade.correct
                    ? t('correct')
                    : isPartial
                      ? t('partiallyCorrectPercent', {
                          percent: Math.round(grade.creditFraction * 100),
                        })
                      : t('incorrect')}
                </span>
              </div>

              <div className="font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
                <RichText>{q.question}</RichText>
              </div>

              {isOptionList ? (
                <div className="space-y-2.5">
                  {(q.options ?? []).map((option, i) => {
                    const selected = raw === option;
                    const isCorrectOption =
                      option === resolveCorrectAnswer(q.options ?? [], q.correctAnswer);
                    const styles = getReviewOptionStyles(selected, isCorrectOption, grade.correct);
                    const letter = LETTERS[i] ?? String(i + 1);
                    return (
                      <div
                        key={option}
                        className={`flex items-center gap-3 rounded-xl border-2 bg-muted/30 p-4 ${styles.label}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${styles.letter}`}
                        >
                          {letter}
                        </span>
                        <span className="text-[15px]">
                          <RichText inline>{option}</RichText>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('yourAnswerLabel')}{' '}
                    <span
                      className={`font-semibold ${
                        grade.correct ? 'text-success' : isPartial ? 'text-warning' : 'text-destructive'
                      }`}
                    >
                      {answerText ? <RichText inline>{answerText}</RichText> : t('notAnswered')}
                    </span>
                  </p>
                  {correctText && (
                    <p className="text-sm text-muted-foreground">
                      {t('correctAnswerLabel')}{' '}
                      <span className="font-semibold text-foreground">
                        <RichText inline>{correctText}</RichText>
                      </span>
                    </p>
                  )}
                </div>
              )}

              {q.explanation && (
                <div className={grade.correct ? 'od-quiz-explanation' : 'od-quiz-explanation-wrong'}>
                  <div
                    className={
                      grade.correct ? 'od-quiz-explanation-title' : 'od-quiz-explanation-wrong-title'
                    }
                  >
                    {grade.correct ? t('explanationCorrect') : t('explanationWrong')}
                  </div>
                  <RichText>{q.explanation}</RichText>
                </div>
              )}

              {q.sourceQuote && (
                <details className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                  <summary className="cursor-pointer select-none font-label text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t('sourceLabel')}
                  </summary>
                  <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                    <RichText inline>{q.sourceQuote}</RichText>
                  </blockquote>
                </details>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-center pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('backToResults')}
        </Button>
      </div>
    </section>
  );
}

/** Compact per-section mastery movement caused by the attempt just submitted. */
function MasteryDeltaList({ deltas, contentId }: { deltas: MasteryDelta[]; contentId: string }) {
  const t = useTranslations('quiz');
  const { data: sections } = useSections(contentId);
  if (deltas.length === 0) return null;
  const titleById = new Map((sections ?? []).map((section) => [section.id, section.title]));
  const bandIndex = (band: MasteryDelta['band']) => MASTERY_BAND_ORDER.indexOf(band);

  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {t('masteryTitle')}
      </p>
      {deltas.map((delta) => {
        const name = delta.sectionId
          ? titleById.get(delta.sectionId) ?? t('masterySection')
          : t('masteryOverall');
        const up = delta.after > delta.before;
        const down = delta.after < delta.before;
        const bandMoved = bandIndex(delta.band) - bandIndex(delta.bandBefore);
        return (
          <div
            key={delta.scopeKey}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
            <span
              className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
                up ? 'text-success' : down ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {delta.before} → {delta.after}
              {up ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : down ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : null}
            </span>
            <Badge variant={bandMoved > 0 ? 'success' : bandMoved < 0 ? 'warning' : 'secondary'}>
              {t(`masteryBands.${delta.band}`)}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('quiz');
  const tContent = useTranslations('content');
  const queryClient = useQueryClient();
  const { data: quiz, isLoading } = useQuiz(id, 3000);
  const { data: latestAttemptData, isLoading: attemptLoading } = useLatestQuizAttempt(id);
  const submitQuiz = useSubmitQuiz();
  const [retaking, setRetaking] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);
  const contentId = quiz?.contentId ?? '';
  const { data: content } = useContent(contentId);

  const handleSubmit = async (answers: Record<string, QuizAnswerValue>) => {
    await submitQuiz.mutateAsync({ quizId: id, answers, contentId });
    void queryClient.invalidateQueries({ queryKey: ['mastery', contentId] });
    setReviewing(false);
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
  // All quizzes are practice quizzes now — legacy QUICK rows get the same generic label.
  const quizLabel = t('fullLabel');

  const resultData = submitQuiz.data ?? latestAttemptData;
  const showResult = !retaking && resultData?.attempt != null;
  // Mastery movement is only meaningful right after a fresh submit.
  const masteryDeltas = submitQuiz.data?.masteryDeltas ?? [];

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
          <p className="mb-1 font-label text-xs font-semibold uppercase tracking-[0.2em] text-primary">{quizLabel}</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {questionCount > 0
              ? t('questionCount', { count: questionCount })
              : isQuizGenerationStale(quiz)
                ? t('generationFailed')
                : t('generatingQuestions')}
          </p>
          {showResult && resultData.attempt ? (
            reviewing ? (
              <QuizReviewList
                quiz={quiz}
                answers={resultData.attempt.answers}
                onBack={() => setReviewing(false)}
              />
            ) : (
              <>
                <QuizResult
                  score={resultData.attempt.score}
                  correct={resultData.correct ?? 0}
                  total={resultData.total ?? questionCount}
                  onRetry={() => {
                    setReviewing(false);
                    setRetaking(true);
                    setRetakeKey((k) => k + 1);
                  }}
                  onReview={() => setReviewing(true)}
                />
                {masteryDeltas.length > 0 && (
                  <MasteryDeltaList deltas={masteryDeltas} contentId={contentId} />
                )}
              </>
            )
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
