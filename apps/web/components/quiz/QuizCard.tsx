'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@talim/ui';
import type { Quiz, QuizQuestion } from '@talim/types';

interface QuizCardProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>) => void;
  isSubmitting?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizCard({ quiz, onSubmit, isSubmitting }: QuizCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = quiz.questions ?? [];

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">Test savollari yaratilmoqda...</p>
          <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-primary to-accent-secondary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const q = questions[currentIndex] as QuizQuestion | undefined;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!q) return null;

  const answered = !!answers[q.id];

  return (
    <div>
      <div className="h-1 w-full overflow-hidden bg-border">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent-secondary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <Card className="mt-0 overflow-hidden rounded-2xl border shadow-sm">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {currentIndex + 1}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ko&apos;p tanlov
            </span>
          </div>
          <p className="text-lg font-semibold leading-snug">{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((option, i) => {
              const selected = answers[q.id] === option;
              const letter = LETTERS[i] ?? String(i + 1);
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-2 bg-muted/30 p-4 transition-colors ${
                    selected
                      ? 'border-primary bg-accent/50'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={option}
                    checked={selected}
                    onChange={() => handleSelect(q.id, option)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-[15px]">{option}</span>
                </label>
              );
            })}
          </div>
          {answered && q.explanation && (
            <div className="od-quiz-explanation">
              <div className="od-quiz-explanation-title">✓ Tushuntirish</div>
              <p>{q.explanation}</p>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
              Oldingi
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={goNext} disabled={!answered}>
                Keyingi
              </Button>
            ) : (
              <Button
                onClick={() => onSubmit(answers)}
                disabled={isSubmitting || Object.keys(answers).length < questions.length}
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Testni yakunlash'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
