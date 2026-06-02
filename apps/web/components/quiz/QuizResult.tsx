'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@talim/ui';

interface QuizResultProps {
  score: number;
  correct: number;
  total: number;
}

export function QuizResult({ score, correct, total }: QuizResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Results</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">{score.toFixed(0)}%</p>
        <p className="mt-2 text-muted-foreground">
          You got {correct} out of {total} questions correct.
        </p>
      </CardContent>
    </Card>
  );
}
