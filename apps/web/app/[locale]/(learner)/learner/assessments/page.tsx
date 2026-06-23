'use client';

import { useState } from 'react';
import { Button, Input } from '@talim/ui';
import type { AssessmentSubmitResult, LearnerAssessment } from '@talim/types';
import {
  useLearnerAssessments,
  useLearnerLeaderboard,
  useSubmitLearnerAssessment,
} from '@/hooks/useAssessments';
import { GameQuizPlayer } from '@/components/learner/game-quiz-player';
import { LeaderboardTable } from '@/components/learner/leaderboard-table';

function Leaderboard({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading } = useLearnerLeaderboard(assessmentId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading leaderboard…</p>;
  if (!data) return null;
  return <LeaderboardTable rows={data.rows} mode={data.mode} />;
}

function WrittenForm({ assessment }: { assessment: LearnerAssessment }) {
  const submit = useSubmitLearnerAssessment();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = assessment.attemptCount >= assessment.maxAttempts;

  if (result) {
    const promptById = new Map(assessment.questions.map((q) => [q.id, q.prompt]));
    return (
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <p className="font-semibold">
          Result: {result.correct}/{result.total} correct
        </p>
        {result.results.map((r, i) => (
          <div
            key={r.questionId}
            className={`rounded-xl border p-3 ${
              r.correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-destructive/40 bg-destructive/5'
            }`}
          >
            <p className="text-sm font-medium">
              {i + 1}. {promptById.get(r.questionId)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.correct ? '✓ Correct' : '✗ Incorrect'} · Your answer: {r.submittedAnswer || '—'}
            </p>
            {!r.correct && r.acceptableAnswers.length > 0 && (
              <p className="text-sm text-muted-foreground">Correct: {r.acceptableAnswers.join(', ')}</p>
            )}
            {r.explanation && <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border bg-card p-5"
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
              'Could not submit your answers.',
          );
        }
      }}
    >
      <div className="space-y-3">
        {assessment.questions.map((question, index) => (
          <div key={question.id} className="space-y-2 rounded-xl border p-3">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}
            </p>
            {question.type === 'MULTIPLE_CHOICE' && question.options?.length ? (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
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
                placeholder={question.type === 'NUMERIC' ? 'Answer with a number' : 'Write your answer'}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={locked || submit.isPending}>
        {locked ? 'Attempt limit reached' : 'Submit answers'}
      </Button>
    </form>
  );
}

function AssessmentCard({ assessment }: { assessment: LearnerAssessment }) {
  const [playing, setPlaying] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const locked = assessment.attemptCount >= assessment.maxAttempts;
  const isGame = assessment.mode === 'GAME';

  if (playing) {
    return <GameQuizPlayer assessment={assessment} onExit={() => setPlaying(false)} />;
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{assessment.title}</h2>
            {isGame && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Game
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Attempts: {assessment.attemptCount}/{assessment.maxAttempts}
            {assessment.latestScore != null ? ` · Latest ${Math.round(assessment.latestScore)}%` : ''}
            {isGame && assessment.latestPoints != null ? ` · ${assessment.latestPoints} pts` : ''}
          </p>
          {assessment.instructions && (
            <p className="mt-1 text-sm text-muted-foreground">{assessment.instructions}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isGame && (
            <Button disabled={locked} onClick={() => setPlaying(true)}>
              {locked ? 'Attempt limit reached' : 'Play'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowBoard((v) => !v)}>
            {showBoard ? 'Hide leaderboard' : 'Leaderboard'}
          </Button>
        </div>
      </div>

      {!isGame && <WrittenForm assessment={assessment} />}
      {showBoard && <Leaderboard assessmentId={assessment.id} />}
    </div>
  );
}

export default function LearnerAssessmentsPage() {
  const { data: assessments = [], isLoading } = useLearnerAssessments();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quizzes &amp; tasks</h1>
        <p className="text-muted-foreground">
          Play game quizzes for points, or answer written tasks. Attempts are limited.
        </p>
      </div>
      {assessments.length === 0 && (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          Nothing assigned yet.
        </p>
      )}
      {assessments.map((assessment) => (
        <AssessmentCard key={assessment.id} assessment={assessment} />
      ))}
    </div>
  );
}
