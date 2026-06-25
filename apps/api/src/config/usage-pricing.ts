/** USD per 1M tokens — update when provider pricing changes */
export const TOKEN_PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
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
