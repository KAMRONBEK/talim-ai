/**
 * Recover a UTF-8 upload filename from multer/busboy.
 *
 * Multer's multipart parser (busboy) decodes the `filename` parameter as latin1
 * by default, so a UTF-8 name (e.g. Cyrillic "Рассказ.pdf") arrives as mojibake
 * ("Ð Ð°ÑÑÐºÐ°Ð·.pdf") because each UTF-8 byte was reinterpreted as a latin1 char.
 * This re-interprets those latin1 bytes back as UTF-8.
 *
 * Safe by construction:
 *  - Pure-ASCII names round-trip to themselves (no-op).
 *  - If any char is beyond the latin1 range, the string is already a decoded
 *    Unicode value (not raw bytes) — leave it untouched.
 *  - If the bytes aren't valid UTF-8 (a genuine latin1 name), keep the original
 *    rather than introduce U+FFFD replacement characters.
 */
export function decodeUploadFilename(name: string): string {
  if (!name) return name;
  for (let i = 0; i < name.length; i++) {
    // A code point above 0xFF means this isn't raw latin1 bytes — already decoded.
    if (name.charCodeAt(i) > 0xff) return name;
  }
  const utf8 = Buffer.from(name, 'latin1').toString('utf8');
  if (utf8.includes('�')) return name; // not valid UTF-8 — keep as-is
  return utf8;
}
