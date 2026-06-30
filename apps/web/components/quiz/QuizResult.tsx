'use client';

import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@talim/ui';

interface QuizResultProps {
  score: number;
  correct: number;
  total: number;
  onRetry?: () => void;
}

export function QuizResult({ score, correct, total, onRetry }: QuizResultProps) {
  const t = useTranslations('quiz');

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="items-center pb-2 text-center">
        <CardTitle className="font-display">{t('resultsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2 text-center">
        <p className="font-display text-6xl font-bold leading-none tabular-nums text-primary">
          {score.toFixed(0)}%
        </p>
        <p className="mt-3 text-muted-foreground">{t('scoreLine', { correct, total })}</p>
        {onRetry && (
          <Button type="button" variant="outline" className="mt-6" onClick={onRetry}>
            {t('retry')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
