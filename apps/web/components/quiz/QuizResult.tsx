'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@talim/ui';

interface QuizResultProps {
  score: number;
  correct: number;
  total: number;
}

export function QuizResult({ score, correct, total }: QuizResultProps) {
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
      </CardContent>
    </Card>
  );
}
