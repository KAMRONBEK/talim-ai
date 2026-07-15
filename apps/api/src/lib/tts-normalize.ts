import type { AppLocale } from '@talim/types';

// ---------------------------------------------------------------------------
// Why this file exists
// ---------------------------------------------------------------------------
// Azure AI Speech's Uzbek neural voices (uz-UZ-Sardor/Madina) are LATIN-script
// only: fed Cyrillic Uzbek they return HTTP 200 with ZERO audio bytes (verified
// against the live resource), so any Cyrillic content came out silent/garbled —
// which read as a "thick accent". Content, however, arrives in a mix of Cyrillic
// and Latin Uzbek. So before synthesis we transliterate Uzbek Cyrillic -> Latin
// and repair the o' / g' apostrophe-letters (oʻ/gʻ) that are often typed with a
// wrong quote char, which the voice mispronounces.
//
// This normalization is APPLIED TO AUDIO ONLY — every TTS entry point
// (synthesizeSpeech, synthesizeDialogueWithSegments) runs it, so it covers
// podcasts (single + two-host) AND video narration AND any future caller. The
// on-screen transcript keeps the original script; only what Azure/OpenAI hears
// is normalized.
//
// Russian (ru-RU) is left in native Cyrillic (its Azure voices expect Cyrillic).
// English keeps acronym spell-out. All locales get light whitespace cleanup.

const MOD_TURNED_COMMA = String.fromCharCode(0x02bb); // ʻ — the oʻ/gʻ apostrophe-letter
const MOD_APOSTROPHE = String.fromCharCode(0x02bc); // ʼ — tutuq belgisi (Cyrillic ъ)

// Wrong apostrophe variants people type for oʻ/gʻ instead of U+02BB:
// ASCII ' , curly ‘ ’ , modifier ʼ , backtick ` , acute ´ , primes ′ ‵.
const WRONG_OG_APOSTROPHE =
  '[' + String.fromCharCode(0x27, 0x2018, 0x2019, 0x02bc, 0x60, 0xb4, 0x2032, 0x2035) + ']';

// Non-breaking space and zero-width characters (built by code point to keep the
// source ASCII-clean and free of invisible glyphs).
const NBSP_RE = new RegExp(String.fromCharCode(0xa0), 'g');
/* eslint-disable no-misleading-character-class -- ZWJ (U+200D) is in this class ON
   PURPOSE: we are stripping zero-width characters, not matching grapheme clusters,
   so the "joined sequence" warning does not apply. */
const ZERO_WIDTH_RE = new RegExp(
  '[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff) + ']',
  'g',
);
/* eslint-enable no-misleading-character-class */

const CYRILLIC_RANGE = /[Ѐ-ӿ]/;

// Uzbek Cyrillic -> Latin (O'zbek lotin yozuvi). Lowercase; case is restored
// afterwards. 'е' is handled contextually (iotated word-initially / post-vowel).
const UZ_CYR_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 's',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ы: 'i',
  э: 'e',
  ё: 'yo',
  ю: 'yu',
  я: 'ya',
  ў: `o${MOD_TURNED_COMMA}`,
  қ: 'q',
  ғ: `g${MOD_TURNED_COMMA}`,
  ҳ: 'h',
  ъ: MOD_APOSTROPHE,
  ь: '',
  // 'е' resolved in transliterateUzbek()
};

const CYR_VOWELS = new Set('аеёиоуўэюяАЕЁИОУЎЭЮЯ');

function isUpperLetter(ch: string): boolean {
  return ch.length > 0 && ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

/** Transliterate Uzbek Cyrillic to Latin, char by char. Non-Cyrillic passes through. */
function transliterateUzbek(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const lower = ch.toLowerCase();

    let lat: string | undefined;
    if (lower === 'е') {
      const prev = i > 0 ? input[i - 1]! : '';
      const atWordStart = prev === '' || !/\p{L}/u.test(prev);
      const afterVowel = CYR_VOWELS.has(prev);
      const afterSign = prev === 'ъ' || prev === 'ь' || prev === 'Ъ' || prev === 'Ь';
      lat = atWordStart || afterVowel || afterSign ? 'ye' : 'e';
    } else {
      lat = UZ_CYR_TO_LAT[lower];
    }

    if (lat === undefined) {
      out += ch; // Latin letter, digit, punctuation, whitespace — leave as-is
      continue;
    }
    if (lat.length === 0) continue; // ь -> dropped

    if (isUpperLetter(ch)) {
      const next = input[i + 1] ?? '';
      lat = isUpperLetter(next)
        ? lat.toUpperCase() // inside an ALL-CAPS run
        : lat.charAt(0).toUpperCase() + lat.slice(1); // Title case
    }
    out += lat;
  }
  return out;
}

/** Repair oʻ / gʻ written with an ASCII/curly apostrophe so Azure says the letter. */
function fixUzbekApostrophes(text: string): string {
  return text
    .replace(new RegExp(`([oO])${WRONG_OG_APOSTROPHE}`, 'g'), `$1${MOD_TURNED_COMMA}`)
    .replace(new RegExp(`([gG])${WRONG_OG_APOSTROPHE}`, 'g'), `$1${MOD_TURNED_COMMA}`);
}

const EN_ACRONYMS: Record<string, string> = {
  AI: 'A I',
  API: 'A P I',
  PDF: 'P D F',
  RAG: 'R A G',
  MCP: 'M C P',
  GPT: 'G P T',
  URL: 'U R L',
  HTTP: 'H T T P',
  JSON: 'J S O N',
  SQL: 'S Q L',
  CPU: 'C P U',
  GPU: 'G P U',
};

function normalizeEnglish(script: string): string {
  let result = script;
  for (const [acronym, spoken] of Object.entries(EN_ACRONYMS)) {
    const re = new RegExp(`\\b${acronym}\\b`, 'g');
    result = result.replace(re, spoken);
  }
  return result;
}

/** Locale-agnostic cleanup that helps every voice and can't change pronunciation. */
function cleanupCommon(text: string): string {
  return text
    .replace(NBSP_RE, ' ')
    .replace(ZERO_WIDTH_RE, '')
    .replace(/[ \t]{2,}/g, ' ') // collapse runs of spaces/tabs
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/**
 * Normalize a script for TTS. Audio-only — the stored transcript keeps the
 * original text. Applied by every synthesis entry point, so it covers podcasts
 * and video narration alike.
 */
export function normalizeScriptForTts(script: string, locale: AppLocale): string {
  let text = script;

  if (locale === 'uz') {
    if (CYRILLIC_RANGE.test(text)) text = transliterateUzbek(text);
    text = fixUzbekApostrophes(text);
  } else if (locale === 'en') {
    text = normalizeEnglish(text);
  }
  // ru: keep native Cyrillic — Azure's ru-RU voices expect it.

  return cleanupCommon(text);
}

export function splitScriptIntoChunks(script: string, maxChars = 700): string[] {
  if (script.length <= maxChars) return [script];

  const sentences = script.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [script];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;

    if ((current + ' ' + piece).trim().length <= maxChars) {
      current = current ? `${current} ${piece}` : piece;
    } else {
      if (current) chunks.push(current.trim());
      if (piece.length <= maxChars) {
        current = piece;
      } else {
        const words = piece.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + ' ' + word).trim().length <= maxChars) {
            wordChunk = wordChunk ? `${wordChunk} ${word}` : word;
          } else {
            if (wordChunk) chunks.push(wordChunk.trim());
            wordChunk = word;
          }
        }
        current = wordChunk;
      }
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [script];
}
