'use client';

import { useState } from 'react';
import { Button, Input } from '@talim/ui';
import type { LearnerAssessment } from '@talim/types';
import { useLearnerAssessments, useSubmitLearnerAssessment } from '@/hooks/useAssessments';

function LearnerAssessmentForm({
  assessment,
  onSubmitted,
}: {
  assessment: LearnerAssessment;
  onSubmitted: (assessmentId: string, result: { correct: number; total: number }) => void;
}) {
  const submit = useSubmitLearnerAssessment();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const locked = assessment.attemptCount >= assessment.maxAttempts;

  return (
    <form
      className="space-y-4 rounded-2xl border bg-card p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const scopedAnswers = Object.fromEntries(
          assessment.questions.map((question) => [question.id, answers[question.id] ?? '']),
        );
        const data = await submit.mutateAsync({ assessmentId: assessment.id, answers: scopedAnswers });
        onSubmitted(assessment.id, { correct: data.correct, total: data.total });
        setAnswers({});
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">{assessment.title}</h2>
        <p className="text-sm text-muted-foreground">
          Attempts: {assessment.attemptCount}/{assessment.maxAttempts}
          {assessment.latestScore != null
            ? ` · Latest score ${Math.round(assessment.latestScore)}%`
            : ''}
        </p>
        {assessment.instructions && (
          <p className="mt-2 text-sm text-muted-foreground">{assessment.instructions}</p>
        )}
      </div>
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
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: option }))
                      }
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
                placeholder={
                  question.type === 'NUMERIC' ? 'Answer with a number' : 'Write your answer'
                }
              />
            )}
          </div>
        ))}
      </div>
      <Button type="submit" disabled={locked || submit.isPending}>
        {locked ? 'Attempt limit reached' : 'Submit answers'}
      </Button>
    </form>
  );
}

export default function LearnerAssessmentsPage() {
  const { data: assessments = [], isLoading } = useLearnerAssessments();
  const [resultsByAssessment, setResultsByAssessment] = useState<
    Record<string, { correct: number; total: number }>
  >({});

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Written tasks</h1>
        <p className="text-muted-foreground">Answer in your own words. Attempts are limited.</p>
      </div>
      {assessments.length === 0 && (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          No written tasks assigned yet.
        </p>
      )}
      {assessments.map((assessment) => {
        const result = resultsByAssessment[assessment.id];
        return (
          <div key={assessment.id} className="space-y-2">
            <LearnerAssessmentForm
              assessment={assessment}
              onSubmitted={(assessmentId, result) =>
                setResultsByAssessment((prev) => ({ ...prev, [assessmentId]: result }))
              }
            />
            {result && (
              <p className="px-1 text-sm text-muted-foreground">
                Result: {result.correct}/{result.total} correct
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
