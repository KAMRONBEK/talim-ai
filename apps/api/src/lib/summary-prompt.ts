const SUMMARY_SYSTEM_PROMPT = `Siz o'quv materiallari uchun xulosa yozadigan o'qituvchisiz.

Qoidalar:
- Javob faqat o'zbek tilida bo'lsin (matn boshqa tilda bo'lsa ham, xulosani o'zbekcha yozing).
- To'g'ridan-to'g'ri mavzuga kirish. Hech qanday kirish so'zi, meta-jumla yoki AI uslubidagi iboralar bo'lmasin.
  YOZMASLIK: "Quyida xulosa", "Mana materialdan ajratilgan matn", "Here is...", "Summary of...", "Ushbu hujjatdan", "handbook", "---".
- Oddiy o'qish matni: har bir mavzu alohida paragraf. Paragraflar orasida bo'sh qator.
- Qisqa sarlavhalar faqat oddiy matn sifatida (masalan: Ven diagrammasi) — markdown (#, **, ---, ro'yxat belgilari) ishlatmang.
- Fayl yoki material nomini takrorlamang.
- Manba matnni qayta ko'chirib yubormang; faqat mavzular va formulalarni tushuntiring.
- Masala yechimlaridagi raqamli nomuvofiqliklarni "xato" deb baholamang — faqat qanday masalalar va formulalar o'rgatilganini yozing.
- 2–4 paragraf yetarli. Umumiy hajm: taxminan 150–350 so'z.`;

function buildSummaryUserPrompt(title: string, context: string): string {
  return `Material: ${title}

Manba matn (ichki foydalanish uchun — javobda ko'chirmang):
${context}

Yuqoridagi material asosida o'quvchi uchun qisqa, tushunarli xulosa yozing. Birinchi jumlada to'g'ridan-to'g'ri mavzuga kiring.`;
}

const AI_PREFIX_PATTERNS = [
  /^here is (?:the )?(?:extracted )?text(?: from (?:the )?(?:document|handbook|material|pdf))?[\s:—-]*/i,
  /^here is (?:a )?summary(?: of (?:the )?(?:document|handbook|material))?[\s:—-]*/i,
  /^here(?:'s| is) (?:the )?(?:document|handbook|material)[\s:—-]*/i,
  /^quyida(?:gi)?(?: xulosa| matn)?[\s:—-]*/i,
  /^mana (?:material|hujjat|darslik)(?:dan)?(?: ajratilgan| olingan)?(?: matn| xulosa)?[\s:—-]*/i,
  /^ushbu (?:hujjat|material|darslik)(?:dan)?[\s:—-]*/i,
  /^---+[\s\n]*/,
];

export function sanitizeSummaryOutput(text: string): string {
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
