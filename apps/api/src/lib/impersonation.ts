import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../config/env.js';

/** How long an impersonation token is valid. Short-lived by design. */
const IMPERSONATION_TTL = '30m';

/**
 * Claims carried by an impersonation JWT. It reuses the normal auth token shape
 * ({ userId, email, role, tenantId? }) so authMiddleware accepts it unchanged,
 * PLUS `imp: true` and `impersonatorId` so downstream code / audit can tell an
 * impersonated session apart from a genuine login.
 */
interface ImpersonationClaims {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  imp: true;
  impersonatorId: string;
}

/**
 * Sign a short-lived (30 min) stateless impersonation JWT for the TARGET user.
 * Reuses env.JWT_SECRET and the existing token shape, so no verification changes
 * are needed on the consuming side.
 */
export function signImpersonationToken(params: {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  impersonatorId: string;
}): string {
  const claims: ImpersonationClaims = {
    userId: params.userId,
    email: params.email,
    role: params.role,
    ...(params.tenantId ? { tenantId: params.tenantId } : {}),
    imp: true,
    impersonatorId: params.impersonatorId,
  };
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: IMPERSONATION_TTL });
}
