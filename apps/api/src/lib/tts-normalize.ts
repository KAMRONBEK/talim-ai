import type { AppLocale } from '@talim/types';

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

export function normalizeScriptForTts(script: string, locale: AppLocale): string {
  const trimmed = script.trim();
  if (locale === 'en') return normalizeEnglish(trimmed);
  return trimmed;
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
