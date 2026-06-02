'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@talim/ui';
import type { Quiz, QuizQuestion } from '@talim/types';

interface QuizCardProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export function QuizCard({ quiz, onSubmit, isSubmitting }: QuizCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = quiz.questions ?? [];

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Generating quiz questions...
        </CardContent>
      </Card>
    );
  }

  const handleSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q: QuizQuestion, index: number) => (
          <div key={q.id} className="space-y-2">
            <p className="font-medium">
              {index + 1}. {q.question}
            </p>
            <div className="space-y-1">
              {q.options.map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name={q.id}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => handleSelect(q.id, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button
          onClick={() => onSubmit(answers)}
          disabled={isSubmitting || Object.keys(answers).length < questions.length}
        >
          Submit Quiz
        </Button>
      </CardContent>
    </Card>
  );
}
