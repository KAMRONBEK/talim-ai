'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@talim/ui';

interface QuizResultProps {
  score: number;
  correct: number;
  total: number;
  onRetry?: () => void;
}

export function QuizResult({ score, correct, total, onRetry }: QuizResultProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Test natijalari</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">{score.toFixed(0)}%</p>
        <p className="mt-2 text-muted-foreground">
          {total} ta savoldan {correct} tasi to&apos;g&apos;ri.
        </p>
        {onRetry && (
          <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
            Qayta ishlash
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
