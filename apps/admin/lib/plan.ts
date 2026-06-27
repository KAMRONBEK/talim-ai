/**
 * Friendly plan-tier labels for the admin panel (English-only — admin has no i18n).
 * Display names match the customer-facing pricing page / web app; the underlying
 * plan CODES (FREE / INDIVIDUAL_PRO / TENANT_STARTER / TENANT_GROWTH) are unchanged
 * and remain the API contract.
 */
export const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free',
  INDIVIDUAL_PRO: 'Pro',
  TENANT_STARTER: 'Team',
  TENANT_GROWTH: 'School',
};

/** Friendly name for a plan code (falls back to the raw code for unknown values). */
export function planLabel(code?: string | null): string {
  if (!code) return '—';
  return PLAN_LABELS[code] ?? code;
}
