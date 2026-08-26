import { z } from 'zod';

/**
 * Validation for any field that stores text a person typed.
 *
 * Two failures kept recurring because each text field was validated on its own:
 *
 *  - A NUL byte (U+0000) is legal inside a JSON string and passes every zod check we apply —
 *    `z.string().min(1)` sees a perfectly good 12-character value. PostgreSQL then rejects the
 *    byte outright in a `text` column, Prisma throws, and the user gets a bare 500 with no idea
 *    what was wrong with what they typed. On the unauthenticated register form there was nothing
 *    to correct and retry.
 *  - `.min(1)` without `.trim()` accepts "   ", so blank names and blank message bubbles reached
 *    the database and rendered as empty UI that could not be deleted.
 *
 * Patching each schema as it was reported would leave every field that has not been probed yet,
 * and every field added later, with the same holes. This is the one place to change instead.
 *
 * Control characters are STRIPPED rather than rejected: they arrive by paste, never by typing,
 * and they are invisible — an error message about a character the user cannot see is not
 * something they can act on. Whatever they can actually see is preserved, and emptiness is
 * judged after stripping, so text that was *only* invisible junk is still rejected.
 */

/**
 * C0/C1 controls, minus tab/newline/carriage-return, which are legitimate in a message body.
 *
 * `no-control-regex` exists to catch control characters that ended up in a pattern by
 * accident. Here they are the entire subject, so the rule is disabled for this line only.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

interface UserTextOptions {
  /** Reject anything longer, after stripping and trimming. Every text column needs one. */
  max: number;
  /** Minimum length after stripping and trimming; 1 means "must not be blank". */
  min?: number;
  /** Keep newlines and tabs. False (the default) collapses them, for single-line fields. */
  multiline?: boolean;
}

/**
 * @returns a schema that strips control characters, normalises whitespace, trims, and only then
 *   enforces length — so the length rules apply to what will actually be stored.
 */
export function userText({ max, min = 1, multiline = false }: UserTextOptions) {
  return z
    .string()
    .transform((value) => value.replace(CONTROL_CHARS, ''))
    .transform((value) => (multiline ? value : value.replace(/[\t\n\r]+/g, ' ')))
    // JS trim() also strips U+00A0, so the non-breaking-space variant of "blank" is covered.
    .transform((value) => value.trim())
    .pipe(z.string().min(min).max(max));
}

/** Longest a person's display name may be, here and in the student importer. */
export const NAME_MAX = 200;
/** Org names sit in a header and a sidebar; unbounded values break both layouts. */
export const ORG_NAME_MAX = 120;
/** Existing limit for tutor/student message bodies. */
export const MESSAGE_MAX = 5000;
