'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@talim/ui';
import type { AssessmentSubmitResult, LearnerAssessment } from '@talim/types';
import { useSubmitLearnerAssessment } from '@/hooks/useAssessments';
import { LogoMark } from '@/components/brand/logo';
import { RichText } from '@/components/learning/rich-text';

type Phase = 'intro' | 'playing' | 'submitting' | 'results';

// Permanently-dark immersive "game stage" chrome — theme-independent (allowed
// fixed-dark exception). Faint cream girih lattice over a deep pine ground.
const GIRIH_OVERLAY =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cg fill='none' stroke='%23F7F2E8' stroke-width='1'%3E%3Crect x='18' y='18' width='36' height='36'/%3E%3Crect x='18' y='18' width='36' height='36' transform='rotate(45 36 36)'/%3E%3C/g%3E%3C/svg%3E\")";

// Colored answer chips cycle through the Scholar accents on the dark stage.
const ANSWER_CHIPS = ['#F7F2E8', '#E0A93D', '#D9663D', '#9DBDB2'];

function GameStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#14332c] bg-[#16322b] text-[#f7f2e8] shadow-[0_24px_60px_-34px_rgba(20,40,30,0.6)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: GIRIH_OVERLAY }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Number of blanks a FILL_BLANK question renders. Config carries `{ blanks }`;
// anything missing/invalid falls back to a single blank so we never crash.
function fillBlankCount(config: Record<string, unknown> | null | undefined): number {
  const n = config?.blanks;
  return typeof n === 'number' && n > 0 ? Math.floor(n) : 1;
}

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
  // Draft state for the pick-many / multi-blank types, reset per question.
  const [selected, setSelected] = useState<string[]>([]);
  const [blankValues, setBlankValues] = useState<string[]>([]);
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
    setSelected([]);
    setBlankValues([]);
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

  // MULTIPLE_SELECT: toggle an option in/out of the pending selection (nothing
  // locks until the learner confirms or the timer runs out).
  function toggleSelect(option: string) {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );
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
      <GameStage>
        <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10">
          <LogoMark className="h-12 w-12 shadow-soft" />
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-[#f7f2e8] sm:text-3xl">
            {assessment.title}
          </h2>
          <p className="mt-3 text-sm text-[#9dc4b8]">
            {t('introMeta', { count: assessment.questions.length, seconds: limitSec })}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              variant="spark"
              onClick={() => {
                startTotalRef.current = Date.now();
                setPhase('playing');
              }}
            >
              {t('start')}
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="border-white/20 bg-white/5 text-[#f7f2e8] hover:bg-white/10 hover:text-[#f7f2e8]"
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </GameStage>
    );
  }

  if (phase === 'submitting') {
    return (
      <GameStage>
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-[#D9663D]" />
          <p className="text-sm text-[#9dc4b8]">{t('scoring')}</p>
        </div>
      </GameStage>
    );
  }

  if (phase === 'results' && result) {
    const promptById = new Map(assessment.questions.map((q) => [q.id, q.prompt]));
    return (
      <GameStage>
        <div className="space-y-5 px-5 py-7 sm:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center">
            <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-[#9dc4b8]">
              {t('yourScore')}
            </p>
            <p className="mt-2 font-display text-6xl font-semibold tabular-nums text-[#f7f2e8]">
              {result.attempt.pointsTotal}
            </p>
            <p className="mt-2 text-sm text-[#9dc4b8]">
              {t('resultSummary', {
                correct: result.correct,
                total: result.total,
                streak: result.attempt.maxStreak,
              })}
            </p>
          </div>
          <div className="space-y-2">
            {result.results.map((r, i) => (
              <div
                key={r.questionId}
                className={`rounded-xl border p-3.5 ${
                  r.correct
                    ? 'border-[#2e7d6b] bg-[#1e5b4f]/40'
                    : 'border-[#e07a55]/50 bg-[#d9663d]/15'
                }`}
              >
                <p className="text-sm font-medium text-[#f7f2e8]">
                  {i + 1}. {promptById.get(r.questionId)}
                </p>
                <p className="mt-1 text-sm text-[#cfe0d9]">
                  {r.correct ? `✓ +${r.pointsAwarded}` : '✗'} ·{' '}
                  <span className="text-[#9dc4b8]">
                    {t('yourAnswer', { answer: r.submittedAnswer || '—' })}
                  </span>
                </p>
                {!r.correct && r.acceptableAnswers.length > 0 && (
                  <p className="text-sm text-[#9dc4b8]">
                    {t('correctAnswer', { answers: r.acceptableAnswers.join(', ') })}
                  </p>
                )}
                {r.explanation && (
                  <p className="mt-1 text-xs text-[#9dc4b8]">{r.explanation}</p>
                )}
              </div>
            ))}
          </div>
          <Button onClick={onExit} variant="spark" className="w-full">
            {t('done')}
          </Button>
        </div>
      </GameStage>
    );
  }

  if (!question) return null;

  const pct = Math.round((timeLeft / limitSec) * 100);
  const ringCircumference = 2 * Math.PI * 37;
  const blanks = question.type === 'FILL_BLANK' ? fillBlankCount(question.config) : 1;
  return (
    <GameStage>
      <div className="flex flex-col px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-[#9dc4b8]">
            {t('questionProgress', { current: index + 1, total: assessment.questions.length })}
          </span>
        </div>

        <div className="flex flex-col items-center py-8 text-center sm:py-12">
          <div className="relative mb-7 h-20 w-20">
            <svg width="80" height="80" viewBox="0 0 84 84" className="-rotate-90">
              <circle cx="42" cy="42" r="37" fill="none" stroke="rgba(247,242,232,0.12)" strokeWidth="7" />
              <circle
                cx="42"
                cy="42"
                r="37"
                fill="none"
                stroke={pct < 25 ? '#E5484D' : '#D9663D'}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - pct / 100)}
                className="transition-[stroke-dashoffset] duration-100"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold tabular-nums text-[#f7f2e8]">
              {Math.ceil(timeLeft)}
            </div>
          </div>

          <div className="mx-auto max-w-2xl font-display text-2xl font-semibold leading-snug text-[#f7f2e8] sm:text-3xl">
            <RichText className="prose-invert prose-p:text-[#f7f2e8]">{question.prompt}</RichText>
          </div>

          {question.type === 'MULTIPLE_CHOICE' && question.options?.length ? (
            <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {question.options.map((option, i) => (
                <Button
                  key={option}
                  variant="outline"
                  className="h-auto justify-start gap-3 rounded-2xl border-white/[0.15] bg-white/[0.08] px-4 py-4 text-left text-[#e7edea] hover:border-white/30 hover:bg-white/[0.14] hover:text-[#f7f2e8]"
                  onClick={() => lockAnswer(option)}
                >
                  <span
                    aria-hidden
                    className="h-7 w-7 flex-shrink-0 rounded-lg"
                    style={{ backgroundColor: ANSWER_CHIPS[i % ANSWER_CHIPS.length] }}
                  />
                  <RichText className="prose-invert" inline>
                    {option}
                  </RichText>
                </Button>
              ))}
            </div>
          ) : question.type === 'TRUE_FALSE' && question.options?.length ? (
            // Two big colored tiles; picking one locks immediately (submits the
            // chosen option TEXT, exactly like MULTIPLE_CHOICE).
            <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
              {question.options.map((option, i) => (
                <Button
                  key={option}
                  variant="outline"
                  className="h-auto min-h-[4.5rem] justify-center gap-3 rounded-2xl border-white/[0.15] bg-white/[0.08] px-4 py-5 text-center text-lg font-semibold text-[#e7edea] hover:border-white/30 hover:bg-white/[0.14] hover:text-[#f7f2e8]"
                  onClick={() => lockAnswer(option)}
                >
                  <span
                    aria-hidden
                    className="h-7 w-7 flex-shrink-0 rounded-lg"
                    style={{ backgroundColor: ANSWER_CHIPS[i % ANSWER_CHIPS.length] }}
                  />
                  <RichText className="prose-invert" inline>
                    {option}
                  </RichText>
                </Button>
              ))}
            </div>
          ) : question.type === 'MULTIPLE_SELECT' && question.options?.length ? (
            // Pick several tiles, then confirm; submits string[] of chosen option
            // values. Auto-lock on timeout still fires via lockAnswer('').
            <div className="mt-8 w-full max-w-2xl">
              <p className="mb-3 font-label text-xs font-semibold uppercase tracking-[0.14em] text-[#9dc4b8]">
                {t('selectHint')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {question.options.map((option, i) => {
                  const isSelected = selected.includes(option);
                  return (
                    <Button
                      key={option}
                      type="button"
                      variant="outline"
                      aria-pressed={isSelected}
                      className={`h-auto justify-start gap-3 rounded-2xl px-4 py-4 text-left ${
                        isSelected
                          ? 'border-[#9DBDB2] bg-[#9DBDB2]/20 text-[#f7f2e8] hover:bg-[#9DBDB2]/25'
                          : 'border-white/[0.15] bg-white/[0.08] text-[#e7edea] hover:border-white/30 hover:bg-white/[0.14] hover:text-[#f7f2e8]'
                      }`}
                      onClick={() => toggleSelect(option)}
                    >
                      <span
                        aria-hidden
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[#16322b]"
                        style={{ backgroundColor: ANSWER_CHIPS[i % ANSWER_CHIPS.length] }}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                      <RichText className="prose-invert" inline>
                        {option}
                      </RichText>
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-[#9dc4b8]">
                  {t('selectedCount', { count: selected.length })}
                </span>
                <Button variant="spark" onClick={() => lockAnswer(JSON.stringify(selected))}>
                  {t('confirm')}
                </Button>
              </div>
            </div>
          ) : question.type === 'FILL_BLANK' && blanks > 1 ? (
            // One input per blank; submits string[] (one entry per blank). A
            // single-blank FILL_BLANK falls through to the default text form and
            // submits a plain string.
            <form
              className="mt-8 flex w-full max-w-md flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                lockAnswer(
                  JSON.stringify(
                    Array.from({ length: blanks }, (_, i) => (blankValues[i] ?? '').trim()),
                  ),
                );
              }}
            >
              {Array.from({ length: blanks }, (_, i) => (
                <Input
                  key={i}
                  autoFocus={i === 0}
                  value={blankValues[i] ?? ''}
                  onChange={(e) =>
                    setBlankValues((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  placeholder={t('blankPlaceholder', { index: i + 1 })}
                  className="border-white/15 bg-white/[0.08] text-[#f7f2e8] placeholder:text-[#7fa89b] focus-visible:ring-[#3e9c86]"
                />
              ))}
              <Button type="submit" variant="spark" className="w-full">
                {t('next')}
              </Button>
            </form>
          ) : (
            <form
              className="mt-8 flex w-full max-w-md gap-2"
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
                className="border-white/15 bg-white/[0.08] text-[#f7f2e8] placeholder:text-[#7fa89b] focus-visible:ring-[#3e9c86]"
              />
              <Button type="submit" variant="spark">
                {t('next')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </GameStage>
  );
}
