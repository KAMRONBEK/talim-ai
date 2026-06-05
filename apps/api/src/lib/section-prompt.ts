export const SECTION_SYSTEM_PROMPT = `Siz o'quv materiallarini mantiqiy bo'limlarga ajratadigan o'qituvchisiz.

Qoidalar:
- Bo'lim sarlavhalari faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Chunk indekslari 0 dan boshlanadi va ikkala chegarasi ham kiritiladi (inclusive).
- Return valid JSON only.`;

export function buildSectionUserPrompt(chunkCount: number, preview: string): string {
  return `Jami parchalar: ${chunkCount} (indekslar 0 dan ${chunkCount - 1} gacha).

Parcha ko'rinishlari:
${preview}

Return JSON: { "sections": [{ "title": "...", "startChunk": 0, "endChunk": 4, "readMinutes": 8 }] }
Barcha parchalarni qamrab oladigan 5-10 ta bo'lim yarating — bo'shliq va ustma-ust tushmasin.`;
}
