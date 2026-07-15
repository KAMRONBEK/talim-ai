const AI_PREFIX_PATTERNS = [
  /^here is (?:the )?(?:extracted )?text(?: from (?:the )?(?:document|handbook|material|pdf))?[\s:—-]*/i,
  /^here is (?:a )?summary(?: of (?:the )?(?:document|handbook|material))?[\s:—-]*/i,
  /^here(?:'s| is) (?:the )?(?:document|handbook|material)[\s:—-]*/i,
  /^quyida(?:gi)?(?: xulosa| matn)?[\s:—-]*/i,
  /^mana (?:material|hujjat|darslik)(?:dan)?(?: ajratilgan| olingan)?(?: matn| xulosa)?[\s:—-]*/i,
  /^ushbu (?:hujjat|material|darslik)(?:dan)?[\s:—-]*/i,
  /^---+[\s\n]*/,
];

/** Strip common markdown and AI preamble artifacts when the model still returns them. */
export function formatSummaryForDisplay(text: string): string {
  let cleaned = text.trim();

  for (const pattern of AI_PREFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitSummaryParagraphs(text: string): string[] {
  return formatSummaryForDisplay(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}
