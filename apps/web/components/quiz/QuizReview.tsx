'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronLeft, X } from 'lucide-react';
import { Button, Card, CardContent } from '@talim/ui';
import {
  isSelectedAnswerCorrect,
  resolveCorrectAnswer,
  type Quiz,
  type QuizQuestion,
} from '@talim/types';
import { RichText } from '@/components/learning/rich-text';

interface QuizReviewProps {
  quiz: Quiz;
  /** The submitted answers from the graded attempt, keyed by question id. */
  answers: Record<string, string>;
  onBack: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Mirror of QuizCard's client grading for SHORT_ANSWER / NUMERIC. */
function isOpenAnswerCorrect(question: QuizQuestion, answer: string): boolean {
  if (!answer.trim()) return false;
  const acceptable = question.acceptableAnswers?.length
    ? question.acceptableAnswers
    : question.correctAnswer
      ? [question.correctAnswer]
      : [];
  if (question.type === 'NUMERIC') {
    const n = Number(answer.replace(',', '.'));
    if (Number.isNaN(n)) return false;
    return acceptable.some((v) => Math.abs(Number(v.replace(',', '.')) - n) <= 0.001);
  }
  return acceptable.some((v) => normalize(v) === normalize(answer));
}

function isQuestionCorrect(question: QuizQuestion, answer: string | undefined): boolean {
  if (question.type === 'MULTIPLE_CHOICE') {
    return isSelectedAnswerCorrect(question.options ?? [], answer, question.correctAnswer);
  }
  return isOpenAnswerCorrect(question, answer ?? '');
}

/** Post-answer option styling — matches QuizCard's revealed (answered) branch. */
function getOptionStyles(
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

export function QuizReview({ quiz, answers, onBack }: QuizReviewProps) {
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
        const isMultipleChoice = q.type === 'MULTIPLE_CHOICE';
        const answer = answers[q.id] ?? '';
        const hasAnswer = Boolean(answer.trim());
        const isCorrect = isQuestionCorrect(q, answer);
        const typeLabel = isMultipleChoice
          ? t('multipleChoice')
          : q.type === 'NUMERIC'
            ? t('numeric')
            : t('shortAnswer');
        const correctAnswerText = q.acceptableAnswers?.[0] ?? q.correctAnswer;

        return (
          <Card key={q.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {typeLabel}
                </span>
                <span
                  className={`ml-auto flex items-center gap-1.5 text-sm font-semibold ${isCorrect ? 'text-success' : 'text-destructive'}`}
                >
                  {isCorrect ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <X className="h-4 w-4" strokeWidth={3} />
                  )}
                  {isCorrect ? t('correct') : t('incorrect')}
                </span>
              </div>

              <div className="font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
                <RichText>{q.question}</RichText>
              </div>

              {isMultipleChoice ? (
                <div className="space-y-2.5">
                  {(q.options ?? []).map((option, i) => {
                    const selected = answer === option;
                    const isCorrectOption =
                      option === resolveCorrectAnswer(q.options ?? [], q.correctAnswer);
                    const styles = getOptionStyles(selected, isCorrectOption, isCorrect);
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
                      className={`font-semibold ${isCorrect ? 'text-success' : 'text-destructive'}`}
                    >
                      {hasAnswer ? <RichText inline>{answer}</RichText> : t('notAnswered')}
                    </span>
                  </p>
                  {correctAnswerText && (
                    <p className="text-sm text-muted-foreground">
                      {t('correctAnswerLabel')}{' '}
                      <span className="font-semibold text-foreground">
                        <RichText inline>{correctAnswerText}</RichText>
                      </span>
                    </p>
                  )}
                </div>
              )}

              {q.explanation && (
                <div className={isCorrect ? 'od-quiz-explanation' : 'od-quiz-explanation-wrong'}>
                  <div
                    className={
                      isCorrect ? 'od-quiz-explanation-title' : 'od-quiz-explanation-wrong-title'
                    }
                  >
                    {isCorrect ? t('explanationCorrect') : t('explanationWrong')}
                  </div>
                  <RichText>{q.explanation}</RichText>
                </div>
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
