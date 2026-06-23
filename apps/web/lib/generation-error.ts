/**
 * Classify an AI-generation request failure so the UI can show a proper message.
 * The API returns 402 with `code: 'QUOTA_EXCEEDED'` (+ used/limit) when a plan's
 * generation quota is exhausted, or a plain 402 for an inactive tenant subscription.
 */
export type GenerationErrorKind = 'quota' | 'plan' | 'error';

export interface GenerationErrorInfo {
  kind: GenerationErrorKind;
  used?: number;
  limit?: number;
}

export function classifyGenerationError(error: unknown): GenerationErrorInfo {
  const resp = (
    error as { response?: { status?: number; data?: { code?: string; used?: number; limit?: number } } } | undefined
  )?.response;
  if (resp?.status === 402) {
    if (resp.data?.code === 'QUOTA_EXCEEDED') {
      return { kind: 'quota', used: resp.data.used ?? 0, limit: resp.data.limit ?? 0 };
    }
    return { kind: 'plan' };
  }
  return { kind: 'error' };
}
