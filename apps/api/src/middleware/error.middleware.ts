import type { Request, Response, NextFunction } from 'express';
import type { PlanCode, QuotaFeature } from '@talim/types';
import { ZodError } from 'zod';
import { UPLOAD_MAX_MB } from './upload.middleware.js';

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
  UPLOAD: 'Daily upload limit reached',
  GENERATION: 'Daily AI generation limit reached',
  TUTOR_MESSAGE: 'Daily tutor message limit reached',
  VIDEO: 'Daily AI video limit reached',
  PODCAST: 'Daily podcast limit reached',
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

/** Thrown when an uploaded file exceeds the plan's page/size caps (HTTP 413). */
export class PlanFileLimitError extends AppError {
  readonly code = 'PLAN_FILE_LIMIT' as const;

  constructor(
    public maxPages: number | null,
    public maxFileSizeMb: number | null,
    public pages: number | null,
    public fileSizeMb: number | null,
    public upgradePlanCode: PlanCode | null,
  ) {
    super(413, "This file exceeds your plan's limits");
    this.name = 'PlanFileLimitError';
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

  if (err instanceof PlanFileLimitError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      maxPages: err.maxPages,
      maxFileSizeMb: err.maxFileSizeMb,
      pages: err.pages,
      fileSizeMb: err.fileSizeMb,
      upgradePlanCode: err.upgradePlanCode,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err.message.startsWith('Only PDF files are supported')) {
    res.status(400).json({ message: err.message });
    return;
  }

  // Multer rejects (oversized file, too many parts, unexpected field) arrive here
  // as a MulterError — map them to a clear 413/400 instead of a generic 500.
  if (err.name === 'MulterError') {
    const code = (err as { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        message: `File is too large. The maximum upload size is ${UPLOAD_MAX_MB} MB.`,
        code: 'FILE_TOO_LARGE',
        maxFileSizeMb: UPLOAD_MAX_MB,
      });
      return;
    }
    res.status(400).json({ message: `Upload error: ${err.message}`, code: 'UPLOAD_ERROR' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
