/**
 * Uzbek Latin ↔ Cyrillic transliteration for SEARCH.
 *
 * Uzbek is written in both scripts. Study materials (e.g. Quran/tajweed books)
 * are frequently Cyrillic, while learners type queries in Latin (and vice versa).
 * The retrieval layer (dense embedding + lexical tsvector) does not bridge the two
 * scripts on its own — a Latin "shin" never matches a Cyrillic "шин" lexically, and
 * dense recall across scripts is weak for low-resource Uzbek. These mappings are
 * approximate (good enough to make lexical/dense matches fire), NOT a perfect
 * reversible transliterator.
 */

// Multi-character Latin sequences first (longest match wins).
const LATIN_TO_CYRILLIC: [string, string][] = [
  ["o'", 'ў'],
  ['oʻ', 'ў'],
  ["g'", 'ғ'],
  ['gʻ', 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['ye', 'е'],
  ['ts', 'ц'],
  ['a', 'а'],
  ['b', 'б'],
  ['c', 'к'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'ҳ'],
  ['i', 'и'],
  ['j', 'ж'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['q', 'қ'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['w', 'в'],
  ['x', 'х'],
  ['y', 'й'],
  ['z', 'з'],
  ["'", 'ъ'],
  ['ʼ', 'ъ'],
];

// Cyrillic → Latin (multi-char Cyrillic letters expand to digraphs).
const CYRILLIC_TO_LATIN: [string, string][] = [
  ['ў', "o'"],
  ['ғ', "g'"],
  ['ш', 'sh'],
  ['ч', 'ch'],
  ['щ', 'sh'],
  ['ё', 'yo'],
  ['ю', 'yu'],
  ['я', 'ya'],
  ['ц', 'ts'],
  ['ъ', "'"],
  ['ь', ''],
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['д', 'd'],
  ['е', 'e'],
  ['ж', 'j'],
  ['з', 'z'],
  ['и', 'i'],
  ['й', 'y'],
  ['к', 'k'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['у', 'u'],
  ['ф', 'f'],
  ['х', 'x'],
  ['ҳ', 'h'],
  ['қ', 'q'],
  ['э', 'e'],
];

function transliterate(text: string, map: [string, string][]): string {
  const lower = text.toLowerCase();
  let out = '';
  let i = 0;
  outer: while (i < lower.length) {
    for (const [from, to] of map) {
      if (from.length > 1 && lower.startsWith(from, i)) {
        out += to;
        i += from.length;
        continue outer;
      }
    }
    const ch = lower[i]!;
    const single = map.find(([from]) => from.length === 1 && from === ch);
    out += single ? single[1] : ch;
    i += 1;
  }
  return out;
}

const CYRILLIC_RE = /[а-яёўғқҳ]/i;
const LATIN_RE = /[a-z]/i;

function toCyrillic(text: string): string {
  return transliterate(text, LATIN_TO_CYRILLIC);
}

function toLatin(text: string): string {
  return transliterate(text, CYRILLIC_TO_LATIN);
}

/**
 * Return the query plus its opposite-script transliteration(s), deduped and
 * non-empty. A Latin query yields its Cyrillic form (to hit Cyrillic material);
 * a Cyrillic query yields its Latin form; mixed text yields both.
 */
export function scriptVariants(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const variants = new Set<string>([trimmed]);
  if (LATIN_RE.test(trimmed)) variants.add(toCyrillic(trimmed));
  if (CYRILLIC_RE.test(trimmed)) variants.add(toLatin(trimmed));
  return [...variants].map((v) => v.trim()).filter(Boolean);
}
