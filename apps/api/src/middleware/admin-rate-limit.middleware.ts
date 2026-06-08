import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.middleware.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function adminRateLimit(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const key = req.user?.userId ?? req.ip ?? 'anonymous';
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= MAX_REQUESTS) {
    res.status(429).json({ message: 'Too many admin requests' });
    return;
  }

  bucket.count += 1;
  next();
}
