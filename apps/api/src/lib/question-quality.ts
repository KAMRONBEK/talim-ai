function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A question "parrots" the source when its prompt is lifted near-verbatim from the
 * material — the exact thing we don't want ("questions shouldn't repeat what it
 * says"). True when the whole prompt, or a 10+ word contiguous run of it, appears
 * verbatim in the source context.
 */
export function isParroting(prompt: string, context: string): boolean {
  const p = normalizeText(prompt.replace(/\?+\s*$/, ''));
  const words = p.split(' ').filter(Boolean);
  if (words.length < 6) return false; // too short to judge as copied
  const c = normalizeText(context);
  if (!c) return false;
  if (c.includes(p)) return true;
  for (let i = 0; i + 10 <= words.length; i++) {
    if (c.includes(words.slice(i, i + 10).join(' '))) return true;
  }
  return false;
}

/**
 * Drop generated questions that parrot the source. Never returns empty when the
 * input was non-empty — if every item is filtered (e.g. tiny source), the originals
 * are kept so generation still yields something.
 */
export function dropParrotingQuestions<T extends { prompt?: string; question?: string }>(
  questions: T[],
  context: string,
): T[] {
  if (!context.trim() || questions.length === 0) return questions;
  const kept = questions.filter((q) => !isParroting(q.prompt ?? q.question ?? '', context));
  return kept.length > 0 ? kept : questions;
}
