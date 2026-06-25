'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@talim/ui';
import type { AssessmentSubmitResult, LearnerAssessment } from '@talim/types';
import { useSubmitLearnerAssessment } from '@/hooks/useAssessments';
import { RichText } from '@/components/learning/rich-text';

type Phase = 'intro' | 'playing' | 'submitting' | 'results';

export function GameQuizPlayer({
  assessment,
  onExit,
}: {
  assessment: LearnerAssessment;
  onExit: () => void;
}) {
  const t = useTranslations('learner.game');
  const submit = useSubmitLearnerAssessment();
  const limitSec = assessment.secondsPerQuestion ?? 20;
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(limitSec);
  const [textAnswer, setTextAnswer] = useState('');
  const [result, setResult] = useState<AssessmentSubmitResult | null>(null);
  const startRef = useRef(0);
  const startTotalRef = useRef(0);
  const lockedRef = useRef(false);

  const question = assessment.questions[index];

  useEffect(() => {
    if (phase !== 'playing' || !question) return;
    startRef.current = Date.now();
    lockedRef.current = false;
    setTimeLeft(limitSec);
    setTextAnswer('');
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, limitSec - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(id);
        lockAnswer('');
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  function lockAnswer(answer: string) {
    if (!question || lockedRef.current) return;
    lockedRef.current = true;
    const elapsedMs = Math.min(Date.now() - startRef.current, limitSec * 1000);
    const nextAnswers = { ...answers, [question.id]: answer };
    const nextTimings = { ...timings, [question.id]: Math.round(elapsedMs) };
    setAnswers(nextAnswers);
    setTimings(nextTimings);
    if (index + 1 < assessment.questions.length) {
      setIndex(index + 1);
    } else {
      void finish(nextAnswers, nextTimings);
    }
  }

  async function finish(finalAnswers: Record<string, string>, finalTimings: Record<string, number>) {
    setPhase('submitting');
    try {
      const data = await submit.mutateAsync({
        assessmentId: assessment.id,
        answers: finalAnswers,
        timings: finalTimings,
        durationMs: Date.now() - startTotalRef.current,
      });
      setResult(data);
      setPhase('results');
    } catch (err) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          t('submitError'),
      );
      onExit();
    }
  }

  if (phase === 'intro') {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-secondary/15 text-3xl">🎮</div>
        <h2 className="mt-4 font-display text-xl font-bold">{assessment.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('introMeta', { count: assessment.questions.length, seconds: limitSec })}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="spark"
            onClick={() => {
              startTotalRef.current = Date.now();
              setPhase('playing');
            }}
          >
            {t('start')}
          </Button>
          <Button variant="outline" onClick={onExit}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-muted-foreground shadow-soft">
        {t('scoring')}
      </div>
    );
  }

  if (phase === 'results' && result) {
    const promptById = new Map(assessment.questions.map((q) => [q.id, q.prompt]));
    return (
      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="rounded-2xl bg-brand-radial p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('yourScore')}</p>
          <p className="font-display text-5xl font-extrabold tabular-nums text-primary">{result.attempt.pointsTotal}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('resultSummary', { correct: result.correct, total: result.total, streak: result.attempt.maxStreak })}
          </p>
        </div>
        <div className="space-y-2">
          {result.results.map((r, i) => (
            <div
              key={r.questionId}
              className={`rounded-xl border p-3 ${
                r.correct ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5'
              }`}
            >
              <p className="text-sm font-medium">
                {i + 1}. {promptById.get(r.questionId)}
              </p>
              <p className="mt-1 text-sm">
                {r.correct ? `✓ +${r.pointsAwarded}` : '✗'} ·{' '}
                <span className="text-muted-foreground">
                  {t('yourAnswer', { answer: r.submittedAnswer || '—' })}
                </span>
              </p>
              {!r.correct && r.acceptableAnswers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('correctAnswer', { answers: r.acceptableAnswers.join(', ') })}
                </p>
              )}
              {r.explanation && (
                <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>
              )}
            </div>
          ))}
        </div>
        <Button onClick={onExit} className="w-full">
          {t('done')}
        </Button>
      </div>
    );
  }

  if (!question) return null;

  const pct = Math.round((timeLeft / limitSec) * 100);
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">
          {t('questionProgress', { current: index + 1, total: assessment.questions.length })}
        </span>
        <span className="font-display font-bold tabular-nums">{Math.ceil(timeLeft)}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-[width] duration-100 ${pct < 25 ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="font-display text-lg font-semibold">
        <RichText>{question.prompt}</RichText>
      </div>
      {question.type === 'MULTIPLE_CHOICE' && question.options?.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <Button
              key={option}
              variant="outline"
              className="h-auto justify-start py-3 text-left"
              onClick={() => lockAnswer(option)}
            >
              <RichText inline>{option}</RichText>
            </Button>
          ))}
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            lockAnswer(textAnswer.trim());
          }}
        >
          <Input
            autoFocus
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder={question.type === 'NUMERIC' ? t('numberPlaceholder') : t('answerPlaceholder')}
          />
          <Button type="submit">{t('next')}</Button>
        </form>
      )}
    </div>
  );
}
