'use client';

import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Button } from '@talim/ui';

interface QuizResultProps {
  score: number;
  correct: number;
  total: number;
  onRetry?: () => void;
  onReview?: () => void;
}

const RING_RADIUS = 64;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function QuizResult({ score, correct, total, onRetry, onReview }: QuizResultProps) {
  const t = useTranslations('quiz');

  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const incorrect = Math.max(0, total - correct);
  const correctPct = total > 0 ? (correct / total) * 100 : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - pct / 100);

  const headline =
    pct >= 80 ? t('resultHeadlineHigh') : pct >= 50 ? t('resultHeadlineMid') : t('resultHeadlineLow');
  const encourage =
    pct >= 80
      ? t('resultEncourageHigh')
      : pct >= 50
        ? t('resultEncourageMid')
        : t('resultEncourageLow');

  return (
    <section className="overflow-hidden rounded-[18px] border border-border bg-card shadow-lg">
      <div className="grid items-stretch md:grid-cols-[0.85fr_1.15fr]">
        {/* Score panel */}
        <div
          className="flex flex-col items-center justify-center border-b border-border p-8 text-center md:border-b-0 md:border-r"
          style={{
            backgroundImage:
              'radial-gradient(120% 80% at 50% 20%, hsl(var(--accent)), hsl(var(--card)))',
          }}
        >
          <div className="relative h-[148px] w-[148px]">
            <svg
              width="148"
              height="148"
              viewBox="0 0 148 148"
              className="-rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="74"
                cy="74"
                r={RING_RADIUS}
                fill="none"
                stroke="hsl(var(--primary) / 0.15)"
                strokeWidth="11"
              />
              <circle
                cx="74"
                cy="74"
                r={RING_RADIUS}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[40px] font-semibold leading-none tabular-nums text-primary">
                {pct}%
              </span>
              <span className="mt-1.5 text-xs text-muted-foreground">
                {t('scoreLine', { correct, total })}
              </span>
            </div>
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">{headline}</h2>
          <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
            {encourage}
          </p>
          {(onRetry || onReview) && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {onRetry && (
                <Button type="button" onClick={onRetry}>
                  {t('retry')}
                </Button>
              )}
              {onReview && (
                <Button type="button" variant="outline" onClick={onReview}>
                  {t('review')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Breakdown panel */}
        <div className="p-6 sm:p-8">
          <p className="mb-4 font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t('resultBreakdownTitle')}
          </p>
          <div className="mb-5 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="bg-primary" style={{ width: `${correctPct}%` }} />
            <div className="bg-accent-secondary" style={{ width: `${100 - correctPct}%` }} />
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-primary bg-accent p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  {t('resultCorrectCount', { count: correct })}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {incorrect > 0 ? t('resultCorrectDesc') : t('resultAllCorrect')}
                </p>
              </div>
            </div>
            {incorrect > 0 && (
              <div className="flex items-start gap-3 rounded-2xl border border-accent-secondary bg-accent-secondary/10 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-secondary text-accent-secondary-foreground">
                  <X className="h-4 w-4" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    {t('resultReviewCount', { count: incorrect })}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t('resultReviewDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
