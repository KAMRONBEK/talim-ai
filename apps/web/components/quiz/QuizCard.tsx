'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, Input } from '@talim/ui';
import {
  gradeQuestion,
  resolveCorrectAnswer,
  type Quiz,
  type QuizQuestion,
} from '@talim/types';
import { RichText } from '@/components/learning/rich-text';
import { isQuizGenerationStale, QUIZ_GENERATION_TIMEOUT_MS } from '@/hooks/useQuiz';
import {
  blankCount,
  DropdownClozeInput,
  FillBlankInput,
  FlashcardInput,
  gradableQuestion,
  isAnswerProvided,
  MatchingInput,
  MultipleSelectInput,
  OrderingInput,
  partialCreditUnits,
  questionRenderKind,
  questionTypeLabelKey,
  TrueFalseInput,
  type QuizAnswerValue,
} from './question-inputs';

interface QuizCardProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, QuizAnswerValue>) => void;
  isSubmitting?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Kinds that reveal via an explicit Check button below the editor (vs. lock-on-click). */
const CHECK_KINDS = new Set(['multipleSelect', 'fillBlank', 'dropdownCloze', 'matching', 'ordering']);

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
  return { label: 'border-border bg-muted/20 opacity-60', letter: 'border-border bg-card' };
}

export function QuizCard({ quiz, onSubmit, isSubmitting }: QuizCardProps) {
  const t = useTranslations('quiz');
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setTick] = useState(0);
  const questions = quiz.questions ?? [];

  // No persisted Quiz.status (F59): re-render once the generation window elapses so an
  // empty quiz flips from the "generating" spinner to a failed state instead of forever.
  useEffect(() => {
    if (questions.length > 0) return;
    const remaining = QUIZ_GENERATION_TIMEOUT_MS - (Date.now() - new Date(quiz.createdAt).getTime());
    if (remaining <= 0) return;
    const timer = setTimeout(() => setTick((n) => n + 1), remaining + 500);
    return () => clearTimeout(timer);
  }, [questions.length, quiz.createdAt]);

  if (questions.length === 0) {
    if (isQuizGenerationStale(quiz)) {
      return (
        <Card>
          <CardContent className="space-y-3 py-12 text-center">
            <p className="font-semibold text-destructive">{t('generationFailed')}</p>
            <p className="text-sm text-muted-foreground">{t('generationFailedHint')}</p>
          </CardContent>
        </Card>
      );
    }
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

  /** Current value for a question; ORDERING defaults to the options' starting order. */
  const valueFor = (question: QuizQuestion): QuizAnswerValue | undefined => {
    const value = answers[question.id];
    if (questionRenderKind(question) === 'ordering' && !Array.isArray(value)) {
      return question.options ?? [];
    }
    return value;
  };

  // Multiple-choice / true-false lock and reveal on selection (original behaviour).
  const handleSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setRevealed((prev) => ({ ...prev, [questionId]: true }));
  };

  // Check-based editors stay editable; editing after a check hides the verdict again.
  const handleValue = (questionId: string, value: QuizAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setRevealed((prev) => (prev[questionId] ? { ...prev, [questionId]: false } : prev));
  };

  const reveal = (questionId: string) => setRevealed((prev) => ({ ...prev, [questionId]: true }));

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };
  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = () => {
    const currentAnswers = questions.reduce<Record<string, QuizAnswerValue>>((acc, question) => {
      const value = valueFor(question);
      if (value != null && isAnswerProvided(question, value)) acc[question.id] = value;
      return acc;
    }, {});
    onSubmit(currentAnswers);
  };

  if (!q) return null;

  const kind = questionRenderKind(q);
  const answer = valueFor(q);
  const hasAnswer = isAnswerProvided(q, answer);
  const isRevealed = revealed[q.id] ?? false;
  // Single grading engine — identical to the server's submit grading.
  const grade = gradeQuestion(gradableQuestion(q), answer ?? '', true);
  const isCorrect = grade.correct;
  const isPartial = !isCorrect && grade.creditFraction > 0 && grade.creditFraction < 1;
  const typeLabel = t(questionTypeLabelKey(q.type));
  const allQuestionsAnswered = questions.every((question) =>
    isAnswerProvided(question, valueFor(question)),
  );

  const partialLabel = (() => {
    const units = partialCreditUnits(q);
    if (units && units > 1) {
      return t('partiallyCorrectFraction', {
        hits: Math.round(grade.creditFraction * units),
        total: units,
      });
    }
    return t('partiallyCorrectPercent', { percent: Math.round(grade.creditFraction * 100) });
  })();

  const stringAnswer = typeof answer === 'string' ? answer : '';
  const arrayAnswer = Array.isArray(answer) ? answer : [];
  const recordAnswer =
    answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};

  const setBlank = (index: number, text: string) => {
    const count = blankCount(q);
    const next = Array.from({ length: count }, (_, i) => (i === index ? text : arrayAnswer[i] ?? ''));
    handleValue(q.id, next);
  };

  return (
    <div className="space-y-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent-secondary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {currentIndex + 1}
            </span>
            <span className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {typeLabel}
            </span>
          </div>
          {/* The inline cloze renders the sentence itself (with slot buttons in place of
              the ___ markers), so the plain stem would duplicate it. */}
          {kind !== 'dropdownCloze' && (
            <div className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
              <RichText>{q.question}</RichText>
            </div>
          )}

          {kind === 'multipleChoice' ? (
            <div className="space-y-2.5">
              {(q.options ?? []).map((option, i) => {
                const selected = stringAnswer === option;
                const isCorrectOption =
                  option === resolveCorrectAnswer(q.options ?? [], q.correctAnswer);
                const styles = getOptionStyles(isRevealed, selected, isCorrectOption, isCorrect);
                const letter = LETTERS[i] ?? String(i + 1);
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-muted/30 p-4 transition-colors ${styles.label}`}
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
                    <span className="text-[15px]">
                      <RichText inline>{option}</RichText>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : kind === 'trueFalse' ? (
            <TrueFalseInput
              question={q}
              value={typeof answer === 'string' ? answer : undefined}
              revealed={isRevealed}
              onSelect={(option) => handleSelect(q.id, option)}
            />
          ) : kind === 'multipleSelect' ? (
            <MultipleSelectInput
              question={q}
              value={arrayAnswer}
              revealed={isRevealed}
              onToggle={(option) =>
                handleValue(
                  q.id,
                  arrayAnswer.includes(option)
                    ? arrayAnswer.filter((v) => v !== option)
                    : [...arrayAnswer, option],
                )
              }
            />
          ) : kind === 'fillBlank' ? (
            <FillBlankInput question={q} value={arrayAnswer} revealed={isRevealed} onChangeBlank={setBlank} />
          ) : kind === 'dropdownCloze' ? (
            <DropdownClozeInput
              question={q}
              value={arrayAnswer}
              revealed={isRevealed}
              onChangeBlank={setBlank}
            />
          ) : kind === 'matching' ? (
            <MatchingInput
              question={q}
              value={recordAnswer}
              revealed={isRevealed}
              onPick={(leftPrompt, right) =>
                handleValue(q.id, { ...recordAnswer, [leftPrompt]: right })
              }
            />
          ) : kind === 'ordering' ? (
            <OrderingInput
              question={q}
              value={arrayAnswer.length ? arrayAnswer : (q.options ?? [])}
              revealed={isRevealed}
              onReorder={(next) => handleValue(q.id, next)}
            />
          ) : kind === 'flashcard' ? (
            // Keyed by question id: FlashcardInput holds local reveal state, and without a
            // key React reuses the instance across consecutive flashcards (same tree
            // position), leaking card A's revealed back into card B.
            <FlashcardInput
              key={q.id}
              question={q}
              value={typeof answer === 'string' ? answer : undefined}
              revealed={isRevealed}
              onReport={(report) => handleSelect(q.id, report)}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                inputMode={q.type === 'NUMERIC' ? 'decimal' : 'text'}
                placeholder={t('answerPlaceholder')}
                value={stringAnswer}
                onChange={(e) => handleValue(q.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hasAnswer) {
                    e.preventDefault();
                    reveal(q.id);
                  }
                }}
                aria-invalid={isRevealed && !isCorrect}
                className={
                  isRevealed
                    ? isCorrect
                      ? 'border-success focus-visible:border-success'
                      : 'border-destructive focus-visible:border-destructive'
                    : undefined
                }
              />
              <Button
                variant="outline"
                onClick={() => reveal(q.id)}
                disabled={!hasAnswer || isRevealed}
                className="shrink-0"
              >
                {t('check')}
              </Button>
            </div>
          )}

          {CHECK_KINDS.has(kind) && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => reveal(q.id)} disabled={!hasAnswer || isRevealed}>
                {t('check')}
              </Button>
            </div>
          )}

          {isRevealed && (
            <p
              className={`text-sm font-semibold ${
                isCorrect ? 'text-success' : isPartial ? 'text-warning' : 'text-destructive'
              }`}
            >
              {isCorrect ? t('correct') : isPartial ? partialLabel : t('incorrect')}
            </p>
          )}
          {isRevealed &&
            kind === 'multipleChoice' &&
            !isCorrect &&
            (() => {
              // Misconception rationale for the wrong option the learner picked.
              const selectedIndex = (q.options ?? []).indexOf(stringAnswer);
              const rationale = selectedIndex >= 0 ? q.optionRationales?.[selectedIndex] : null;
              return rationale ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-destructive">{t('whyWrong')}</span>{' '}
                  <RichText inline>{rationale}</RichText>
                </p>
              ) : null;
            })()}
          {isRevealed && kind === 'open' && !isCorrect && q.acceptableAnswers?.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('correctAnswerLabel')}{' '}
              <span className="font-semibold text-foreground">
                <RichText inline>{q.acceptableAnswers[0] ?? ''}</RichText>
              </span>
            </p>
          )}
          {isRevealed && q.explanation && (
            <div className={isCorrect ? 'od-quiz-explanation' : 'od-quiz-explanation-wrong'}>
              <div className={isCorrect ? 'od-quiz-explanation-title' : 'od-quiz-explanation-wrong-title'}>
                {isCorrect ? t('explanationCorrect') : t('explanationWrong')}
              </div>
              <RichText>{q.explanation}</RichText>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
              {t('prev')}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={goNext} disabled={!hasAnswer}>
                {t('next')}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !allQuestionsAnswered}>
                {isSubmitting ? t('submitting') : t('submit')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
