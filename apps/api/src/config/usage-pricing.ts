/** USD per 1M tokens — update when provider pricing changes */
const TOKEN_PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  'deepseek-v4-flash': { input: 0.14, output: 0.28 },
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'whisper-1': { input: 0.006, output: 0 },
  'tts-1-hd': { input: 15, output: 0 },
  'tts-1': { input: 15, output: 0 },
  // Azure neural TTS bills per character (~$16 / 1M chars); inputTokens carries
  // text.length, matching the chars-as-tokens convention used for OpenAI TTS.
  'azure-tts': { input: 16, output: 0 },
  default: { input: 1, output: 3 },
};

/**
 * Monthly recurring price per plan code, in USD. Manual billing — no payment
 * gateway — so this is the canonical price table used to compute MRR. FREE is 0.
 * Kept here (not in a migration) so pricing can change without a schema change.
 * A plan's own `limits.priceMonthlyUsd` (when set) takes precedence over this.
 */
const PLAN_MONTHLY_PRICE_USD: Record<string, number> = {
  FREE: 0,
  INDIVIDUAL_PRO: 10,
  TENANT_STARTER: 49,
  TENANT_GROWTH: 149,
};

/**
 * Resolve a plan's effective monthly USD price. Prefers an explicit
 * `limits.priceMonthlyUsd` when present, otherwise falls back to the
 * PLAN_MONTHLY_PRICE_USD table, otherwise 0 (unknown plan ⇒ treated as free).
 */
export function planMonthlyPriceUsd(
  planCode: string,
  limits?: { priceMonthlyUsd?: number | null } | null,
): number {
  const fromLimits = limits?.priceMonthlyUsd;
  if (typeof fromLimits === 'number' && Number.isFinite(fromLimits)) return fromLimits;
  return PLAN_MONTHLY_PRICE_USD[planCode] ?? 0;
}

export function estimateTokenCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  // Azure voices are recorded as `azure-tts:<voiceId>`; resolve them to the shared
  // per-character rate rather than the generic default.
  const key = model.startsWith('azure-tts:') ? 'azure-tts' : model;
  const pricing = TOKEN_PRICING_PER_MILLION[key] ?? TOKEN_PRICING_PER_MILLION.default!;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}
