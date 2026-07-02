export const SECTION_SYSTEM_PROMPT = `Siz o'quv materiallarini mantiqiy bo'limlarga ajratadigan o'qituvchisiz.

Qoidalar:
- Bo'lim sarlavhalari faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Sarlavhalar qisqa bo'lsin (60 belgidan kam).
- Chunk indekslari 0 dan boshlanadi va ikkala chegarasi ham kiritiladi (inclusive).
- Ixtiyoriy ravishda har bir bo'limni kichik bo'limlarga (subsections) ajratishingiz mumkin — bu ikki bosqichli tuzilma (bob → kichik bob). Kichik bo'limlar kerak bo'lmasa, ularni tushirib qoldiring (oddiy tekis ro'yxat ham to'g'ri).
- Kichik bo'limlar o'z ota-bo'limining chunk oralig'ida bo'lishi kerak; barcha oraliqlar ust-ma-ust tushmasin va bo'shliq qoldirmasin.
- Return valid JSON only.`;

export function buildSectionUserPrompt(chunkCount: number, preview: string): string {
  return `Jami parchalar: ${chunkCount} (indekslar 0 dan ${chunkCount - 1} gacha).

Parcha ko'rinishlari:
${preview}

Return JSON: { "sections": [{ "title": "...", "startChunk": 0, "endChunk": 4, "readMinutes": 8, "subsections": [{ "title": "...", "startChunk": 0, "endChunk": 2, "readMinutes": 4 }] }] }
Barcha parchalarni qamrab oladigan 5-10 ta bo'lim yarating — bo'shliq va ustma-ust tushmasin.
"subsections" ixtiyoriy: material talab qilsa, bobni sayoz (2 bosqichli) kichik bo'limlarga ajrating; aks holda uni tushirib qoldiring.`;
}
