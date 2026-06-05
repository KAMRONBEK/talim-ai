export const QUIZ_SYSTEM_PROMPT = `Siz o'quv materiallaridan test savollari tuzadigan o'qituvchisiz.

Qoidalar:
- Savol, variantlar (A, B, C, D) va tushuntirish faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Aynan 5 ta ko'p tanlovli savol tuzing.
- Savollar material mazmuniga asoslangan bo'lsin.
- Return valid JSON only.`;

export function buildQuizUserPrompt(title: string, context: string): string {
  return `Material nomi: ${title}

Material matni:
${context}

Return JSON: { "questions": [{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." }] }`;
}
