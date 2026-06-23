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
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{t('resultsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-5xl font-bold tabular-nums text-primary">{score.toFixed(0)}%</p>
        <p className="mt-2 text-muted-foreground">{t('scoreLine', { correct, total })}</p>
        {onRetry && (
          <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
            {t('retry')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
