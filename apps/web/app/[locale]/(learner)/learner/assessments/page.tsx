'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Sparkles, Trophy } from 'lucide-react';
import { Badge, Button, Input } from '@talim/ui';
import type { AssessmentSubmitResult, LearnerAssessment } from '@talim/types';
import {
  useLearnerAssessments,
  useLearnerLeaderboard,
  useSubmitLearnerAssessment,
} from '@/hooks/useAssessments';
import { GameQuizPlayer } from '@/components/learner/game-quiz-player';
import { LeaderboardTable } from '@/components/learner/leaderboard-table';

function Leaderboard({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations('learner.assessments');
  const tc = useTranslations('common');
  const { data, isLoading, isError } = useLearnerLeaderboard(assessmentId);
  if (isError) return <p className="text-sm text-destructive">{tc('loadError')}</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">{t('loadingLeaderboard')}</p>;
  if (!data) return null;
  return <LeaderboardTable rows={data.rows} mode={data.mode} />;
}

function WrittenForm({ assessment }: { assessment: LearnerAssessment }) {
  const t = useTranslations('learner.assessments');
  const submit = useSubmitLearnerAssessment();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = assessment.attemptCount >= assessment.maxAttempts;

  if (result) {
    const promptById = new Map(assessment.questions.map((q) => [q.id, q.prompt]));
    return (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-5">
        <p className="font-display font-semibold">
          {t('result', { correct: result.correct, total: result.total })}
        </p>
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
            <p className="mt-1 text-sm text-muted-foreground">
              <span className={r.correct ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
                {r.correct ? t('correctMark') : t('incorrectMark')}
              </span>{' '}
              · {t('yourAnswer', { answer: r.submittedAnswer || '—' })}
            </p>
            {!r.correct && r.acceptableAnswers.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('acceptable', { answers: r.acceptableAnswers.join(', ') })}
              </p>
            )}
            {r.explanation && <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-border/70 bg-background p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const scoped = Object.fromEntries(
          assessment.questions.map((q) => [q.id, answers[q.id] ?? '']),
        );
        try {
          const data = await submit.mutateAsync({ assessmentId: assessment.id, answers: scoped });
          setResult(data);
        } catch (err) {
          setError(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              t('submitError'),
          );
        }
      }}
    >
      <div className="space-y-3">
        {assessment.questions.map((question, index) => (
          <div key={question.id} className="space-y-2 rounded-xl border border-border/70 bg-card p-3">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}
            </p>
            {question.type === 'MULTIPLE_CHOICE' && question.options?.length ? (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <input
                      type="radio"
                      className="h-4 w-4 accent-primary"
                      name={`${assessment.id}-${question.id}`}
                      disabled={locked}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <Input
                disabled={locked}
                value={answers[question.id] ?? ''}
                onChange={(event) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                }
                placeholder={question.type === 'NUMERIC' ? t('numberPlaceholder') : t('textPlaceholder')}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={locked || submit.isPending}>
        {locked ? t('attemptLimit') : t('submit')}
      </Button>
    </form>
  );
}

function AssessmentCard({ assessment }: { assessment: LearnerAssessment }) {
  const t = useTranslations('learner.assessments');
  const [playing, setPlaying] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const locked = assessment.attemptCount >= assessment.maxAttempts;
  const isGame = assessment.mode === 'GAME';

  if (playing) {
    return <GameQuizPlayer assessment={assessment} onExit={() => setPlaying(false)} />;
  }

  return (
    <div
      className={`space-y-4 rounded-2xl border bg-card p-5 shadow-soft ${
        locked
          ? 'border-border/70 opacity-80'
          : `border-l-4 ${
              isGame
                ? 'border-accent-secondary/30 border-l-accent-secondary'
                : 'border-primary/20 border-l-primary'
            }`
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isGame ? (
              <Badge className="bg-accent-secondary text-accent-secondary-foreground hover:bg-accent-secondary">
                {t('gameBadge')}
              </Badge>
            ) : (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                {t('writtenBadge')}
              </Badge>
            )}
            <h2 className="font-display text-lg font-semibold">{assessment.title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('questionCount', { count: assessment.questions.length })}
            {isGame && assessment.secondsPerQuestion != null
              ? ` · ${t('secondsEach', { seconds: assessment.secondsPerQuestion })}`
              : ''}
            {` · ${t('attempts', { used: assessment.attemptCount, max: assessment.maxAttempts })}`}
            {assessment.latestScore != null
              ? ` · ${t('latest', { score: Math.round(assessment.latestScore) })}`
              : ''}
            {isGame && assessment.latestPoints != null
              ? ` · ${t('points', { count: assessment.latestPoints })}`
              : ''}
          </p>
          {assessment.instructions && (
            <p className="mt-1 text-sm text-muted-foreground">{assessment.instructions}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isGame && (
            <Button variant="spark" disabled={locked} onClick={() => setPlaying(true)}>
              <Play className="mr-1.5 h-4 w-4" />
              {locked ? t('attemptLimit') : t('play')}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowBoard((v) => !v)}>
            <Trophy className="mr-1.5 h-4 w-4" />
            {showBoard ? t('hideLeaderboard') : t('leaderboard')}
          </Button>
        </div>
      </div>

      {!isGame && <WrittenForm assessment={assessment} />}
      {showBoard && <Leaderboard assessmentId={assessment.id} />}
    </div>
  );
}

export default function LearnerAssessmentsPage() {
  const t = useTranslations('learner.assessments');
  const { data: assessments = [], isLoading } = useLearnerAssessments();

  if (isLoading) return <p className="text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-label text-xs font-medium uppercase tracking-[0.2em] text-primary">{t('eyebrow')}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('desc')}</p>
      </div>
      {assessments.length === 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="mt-4 text-muted-foreground">{t('empty')}</p>
        </div>
      )}
      {assessments.map((assessment) => (
        <AssessmentCard key={assessment.id} assessment={assessment} />
      ))}
    </div>
  );
}
