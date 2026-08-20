/** Helpers that shape what the tutor actually retrieves and reads. Pure functions —
 *  kept out of the controller so they can be exercised without booting the queue stack. */

// A follow-up short enough to be meaningless on its own ("draw it", "ko'proq
// tushuntir", "the second one") carries no retrievable terms. Below this many words we
// prepend the previous user turn so the query still names its subject.
const FOLLOWUP_WORD_THRESHOLD = 8;
const CARRIED_TURN_WORD_LIMIT = 40;

export interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Query for retrieval: the message alone, or — when it reads as a bare follow-up —
 *  the previous user turn prepended so the subject is present in the embedding. */
export function buildRetrievalQuery(message: string, recentTurns: ConversationTurn[]): string {
  const trimmed = message.trim();
  if (trimmed.split(/\s+/).filter(Boolean).length >= FOLLOWUP_WORD_THRESHOLD) return trimmed;

  const previousUserTurn = [...recentTurns]
    .reverse()
    .find((t) => t.role === 'user' && t.text.trim());
  if (!previousUserTurn) return trimmed;

  const carried = previousUserTurn.text
    .trim()
    .split(/\s+/)
    .slice(0, CARRIED_TURN_WORD_LIMIT)
    .join(' ');
  return carried ? `${carried} ${trimmed}` : trimmed;
}

/** Reorder retrieved chunks by the classifier's `keep` list (1-based, matching the
 *  numbered context it was shown). Unknown, duplicate and out-of-range numbers are
 *  ignored; an absent, empty or fully-invalid list leaves fusion order untouched, so a
 *  degraded model response can never empty the tutor's context. */
export function applyKeepOrder<T>(chunks: T[], keep: number[] | undefined): T[] {
  if (!keep?.length) return chunks;
  const seen = new Set<number>();
  const picked: T[] = [];
  for (const oneBased of keep) {
    const idx = oneBased - 1;
    if (idx < 0 || idx >= chunks.length || seen.has(idx)) continue;
    seen.add(idx);
    picked.push(chunks[idx]!);
  }
  return picked.length ? picked : chunks;
}
