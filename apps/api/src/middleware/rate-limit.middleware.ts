import rateLimit from 'express-rate-limit';
import type { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Login limiter. `skipSuccessfulRequests` means only FAILED logins count, so a
 * whole classroom behind a single NAT IP can still log in normally while
 * password-guessing against an account is bounded.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed attempts. Please wait a few minutes and try again.' },
});

/** General write limiter for register / password-change / tutor-request. */
export const authWriteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' },
});

/**
 * Written-answer AI check limiter. Each check may trigger one small judge call, so cap
 * per-user bursts to bound AI spend. Keyed by user id (runs after authMiddleware) — a
 * classroom behind one NAT IP must not share a bucket.
 */
export const answerCheckRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.userId ?? req.ip ?? 'unknown',
  message: { message: 'Too many answer checks. Please wait a few minutes and try again.' },
});

/**
 * Re-read (OCR) limiter. Each re-read fans out one paid vision call per page, so
 * cap how often it can be triggered to bound AI spend from repeated bursts.
 */
export const reparseRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many re-read requests. Please wait a while and try again.' },
});
