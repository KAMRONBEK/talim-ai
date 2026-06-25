import type { Request, Response, NextFunction } from 'express';
import type { PlanCode, QuotaFeature } from '@talim/types';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const QUOTA_MESSAGES: Record<QuotaFeature, string> = {
  UPLOAD: 'Upload limit reached',
  GENERATION: 'Monthly AI generation limit reached',
  TUTOR_MESSAGE: 'Monthly tutor message limit reached',
  STUDENT: 'Seat limit reached',
};

export class QuotaExceededError extends AppError {
  readonly code = 'QUOTA_EXCEEDED' as const;

  constructor(
    public feature: QuotaFeature,
    public used: number,
    public limit: number,
    public upgradePlanCode: PlanCode | null,
  ) {
    super(402, QUOTA_MESSAGES[feature]);
    this.name = 'QuotaExceededError';
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof QuotaExceededError) {
    res.status(402).json({
      message: err.message,
      code: err.code,
      feature: err.feature,
      used: err.used,
      limit: err.limit,
      upgradePlanCode: err.upgradePlanCode,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err.message === 'Only PDF and slide files are allowed') {
    res.status(400).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
