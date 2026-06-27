import type { PlanCode, QuotaFeature } from '@talim/types';

/**
 * Unified classifier for every usage-limit / plan error the API can return:
 *  - 402 QUOTA_EXCEEDED  — daily/seat feature limit (UPLOAD/GENERATION/TUTOR_MESSAGE/VIDEO/PODCAST/STUDENT)
 *  - 413 PLAN_FILE_LIMIT — file exceeds the plan's per-file page/size caps
 *  - 413 FILE_TOO_LARGE  — file exceeds the hard infra cap (no upgrade lifts it)
 *  - 402 (no code)       — inactive tenant subscription
 *  - 403                 — learner blocked from mutating (not a quota)
 *
 * `upgradePlanCode` (when present) tells us whether a self-serve upgrade exists
 * and which plan to promote: INDIVIDUAL_PRO for a free individual, TENANT_GROWTH
 * for a starter tenant, or null when already on the top plan.
 */
export type LimitError =
  | {
      kind: 'quota';
      feature: QuotaFeature;
      used: number;
      limit: number;
      upgradePlanCode: PlanCode | null;
      message?: string;
    }
  | {
      kind: 'planFile';
      maxPages: number | null;
      maxFileSizeMb: number | null;
      pages: number | null;
      fileSizeMb: number | null;
      upgradePlanCode: PlanCode | null;
      message?: string;
    }
  | { kind: 'fileTooLarge'; maxFileSizeMb: number; message: string }
  | { kind: 'inactive'; message?: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'none' };

interface ApiErrorLike {
  response?: {
    status?: number;
    data?: {
      code?: string;
      message?: string;
      feature?: QuotaFeature;
      used?: number;
      limit?: number;
      maxPages?: number | null;
      maxFileSizeMb?: number | null;
      pages?: number | null;
      fileSizeMb?: number | null;
      upgradePlanCode?: PlanCode | null;
    };
  };
}

export function classifyLimitError(error: unknown): LimitError {
  const resp = (error as ApiErrorLike | undefined)?.response;
  const status = resp?.status;
  const data = resp?.data;

  if (data?.code === 'QUOTA_EXCEEDED') {
    return {
      kind: 'quota',
      feature: (data.feature ?? 'GENERATION') as QuotaFeature,
      used: data.used ?? 0,
      limit: data.limit ?? 0,
      upgradePlanCode: data.upgradePlanCode ?? null,
      message: data.message,
    };
  }
  if (data?.code === 'PLAN_FILE_LIMIT') {
    return {
      kind: 'planFile',
      maxPages: data.maxPages ?? null,
      maxFileSizeMb: data.maxFileSizeMb ?? null,
      pages: data.pages ?? null,
      fileSizeMb: data.fileSizeMb ?? null,
      upgradePlanCode: data.upgradePlanCode ?? null,
      message: data.message,
    };
  }
  if (data?.code === 'FILE_TOO_LARGE') {
    return {
      kind: 'fileTooLarge',
      maxFileSizeMb: data.maxFileSizeMb ?? 0,
      message: data.message ?? '',
    };
  }
  if (status === 402) {
    return { kind: 'inactive', message: data?.message };
  }
  if (status === 403) {
    return { kind: 'forbidden', message: data?.message ?? '' };
  }
  return { kind: 'none' };
}

/** Quota features that an INDIVIDUAL can self-serve upgrade for (→ promotion modal). */
export const INDIVIDUAL_QUOTA_FEATURES: QuotaFeature[] = [
  'UPLOAD',
  'GENERATION',
  'TUTOR_MESSAGE',
  'VIDEO',
  'PODCAST',
];
