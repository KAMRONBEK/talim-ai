'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent } from '@talim/ui';
import {
  isSelectedAnswerCorrect,
  resolveCorrectAnswer,
  type Quiz,
  type QuizQuestion,
} from '@talim/types';

interface QuizCardProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>) => void;
  isSubmitting?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getOptionStyles(
  answered: boolean,
  selected: boolean,
  isCorrectOption: boolean,
  isCorrect: boolean,
): { label: string; letter: string } {
  if (!answered) {
    return {
      label: selected
        ? 'border-primary bg-accent/50'
        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
      letter: selected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card',
    };
  }

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

  return {
    label: 'border-border bg-muted/20 opacity-60',
    letter: 'border-border bg-card',
  };
}

export function QuizCard({ quiz, onSubmit, isSubmitting }: QuizCardProps) {
  const t = useTranslations('quiz');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = quiz.questions ?? [];

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">{t('generating')}</p>
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

  const handleSubmit = () => {
    const currentAnswers = questions.reduce<Record<string, string>>((acc, question) => {
      const answer = answers[question.id];
      if (answer) acc[question.id] = answer;
      return acc;
    }, {});

    onSubmit(currentAnswers);
  };

  if (!q) return null;

  const selectedAnswer = answers[q.id];
  const answered = !!selectedAnswer;
  const isCorrect = isSelectedAnswerCorrect(q.options, selectedAnswer, q.correctAnswer);
  const resolvedCorrect = resolveCorrectAnswer(q.options, q.correctAnswer);
  const allQuestionsAnswered = questions.every((question) => Boolean(answers[question.id]));

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
              {t('multipleChoice')}
            </span>
          </div>
          <p className="font-display text-lg font-semibold leading-snug">{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((option, i) => {
              const selected = selectedAnswer === option;
              const isCorrectOption = option === resolvedCorrect;
              const styles = getOptionStyles(answered, selected, isCorrectOption, isCorrect);
              const letter = LETTERS[i] ?? String(i + 1);
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-2 bg-muted/30 p-4 transition-colors ${styles.label}`}
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
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${styles.letter}`}
                  >
                    {letter}
                  </span>
                  <span className="text-[15px]">{option}</span>
                </label>
              );
            })}
          </div>
          {answered && (
            <p
              className={`text-sm font-semibold ${isCorrect ? 'text-success' : 'text-destructive'}`}
            >
              {isCorrect ? t('correct') : t('incorrect')}
            </p>
          )}
          {answered && q.explanation && (
            <div className={isCorrect ? 'od-quiz-explanation' : 'od-quiz-explanation-wrong'}>
              <div
                className={
                  isCorrect ? 'od-quiz-explanation-title' : 'od-quiz-explanation-wrong-title'
                }
              >
                {isCorrect ? t('explanationCorrect') : t('explanationWrong')}
              </div>
              <p>{q.explanation}</p>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
              {t('prev')}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={goNext} disabled={!answered}>
                {t('next')}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !allQuestionsAnswered}
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
