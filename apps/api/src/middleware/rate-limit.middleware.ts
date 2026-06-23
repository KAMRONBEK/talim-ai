import rateLimit from 'express-rate-limit';

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
