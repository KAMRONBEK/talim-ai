import type { QuizKind } from '@prisma/client';

export const QUIZ_SYSTEM_PROMPT = `Siz o'quv materiallaridan test savollari tuzadigan o'qituvchisiz.

Qoidalar:
- Savol, variantlar (A, B, C, D) va tushuntirish faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Savollar material mazmuniga asoslangan bo'lsin.
- Return valid JSON only.`;

export function getQuestionCount(kind: QuizKind): number {
  return kind === 'QUICK' ? 2 : 5;
}

export function buildQuizUserPrompt(title: string, context: string, kind: QuizKind): string {
  const count = getQuestionCount(kind);
  const kindLabel = kind === 'QUICK' ? 'tez tekshiruv' : 'to\'liq mashq testi';

  return `Material nomi: ${title}
Test turi: ${kindLabel}

Material matni:
${context}

Aynan ${count} ta ko'p tanlovli savol tuzing.

Return JSON: { "questions": [{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." }] }`;
}
