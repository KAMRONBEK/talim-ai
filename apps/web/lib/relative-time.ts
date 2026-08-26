/**
 * How old a message is, as data — the caller turns it into words via next-intl.
 *
 * This deliberately does NOT use `Intl.RelativeTimeFormat`. Chromium reports `uz` from
 * `supportedLocalesOf` while carrying no actual data for it, so Intl silently degrades to root
 * patterns: "-33 min", "-22 h", an English "yesterday", and dates like "M03 14". Uzbek is this
 * product's primary locale, and a lying capability check means that damage can't be detected at
 * runtime either. Our own message catalogue is already required to cover all three locales, so
 * it is both safer and more consistent to format from there.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export type MessageAge =
  /** Recent enough that "now" is honest and less noisy than "0 minutes ago". */
  | { unit: 'now' }
  | { unit: 'minutes' | 'hours' | 'days'; value: number }
  /** Older than a week: an absolute date is more use than "9 days ago". */
  | { unit: 'date'; text: string };

/**
 * @param now injected so callers (and tests) control the clock.
 * @returns `null` when there is no usable timestamp — a bubble created locally moments ago, or
 *   an unparseable value — so the caller falls back to "now", which in that case is true.
 */
export function describeMessageAge(
  iso: string | undefined,
  now: number = Date.now(),
): MessageAge | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;

  // Clock skew putting a message slightly in the future should read as "now", never as a
  // negative age.
  const elapsed = Math.max(0, now - then);
  if (elapsed < MINUTE) return { unit: 'now' };
  if (elapsed < HOUR) return { unit: 'minutes', value: Math.floor(elapsed / MINUTE) };
  if (elapsed < DAY) return { unit: 'hours', value: Math.floor(elapsed / HOUR) };
  if (elapsed < WEEK) return { unit: 'days', value: Math.floor(elapsed / DAY) };

  // Numeric DD.MM.YYYY rather than a localized month name: it is the everyday written form in
  // Uzbekistan and Russia, and it needs neither browser ICU data nor twelve translated months.
  const d = new Date(then);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { unit: 'date', text: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` };
}

/** Full timestamp for the tooltip, where the exact moment is occasionally wanted. */
export function formatExactTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return undefined;
  const d = new Date(then);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
