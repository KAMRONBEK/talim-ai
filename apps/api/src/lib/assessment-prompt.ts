import type { QuestionType } from '@prisma/client';

export const ASSESSMENT_SYSTEM_PROMPT = `Siz O'zbekistondagi maktab va o'quv markazlari uchun savol banki tuzadigan metodistsiz.

Qoidalar:
- Savollar o'zbek tilida, lotin yozuvida bo'lsin.
- Kahoot/Bamboozle kabi qiziqarli, lekin ko'chirish oson bo'lmagan savollar tuzing.
- Asosan yozma yoki raqamli javobli savollar bering. Ko'p tanlovli savol kamroq bo'lsin.
- MULTIPLE_CHOICE savol uchun "options" ichida 3-4 ta variant bo'lsin va "acceptableAnswers" ichidagi to'g'ri javob AYNAN shu variantlardan biriga (harfma-harf) teng bo'lishi SHART. Aks holda bunday savol tuzmang.
- SHORT_ANSWER va NUMERIC savollarda "options" qiymati null bo'lsin.
- Agar material matni berilsa, undan foydalaning. Agar mavzu berilsa, mavzuga mos yangi savollar ham tuzing.
- Return valid JSON only.`;

export function buildAssessmentPrompt(input: {
  title: string;
  topic?: string | null;
  context?: string | null;
  count: number;
}): string {
  return `Savol banki: ${input.title}
Mavzu: ${input.topic ?? 'Material asosida'}

Material yoki kontekst:
${input.context ?? "Kontekst berilmagan. Mavzu bo'yicha yangi, aloqador savollar tuzing."}

${input.count} ta savol tuzing. Turlari:
- SHORT_ANSWER: qisqa yozma javob (options: null)
- NUMERIC: raqamli javob (options: null)
- MULTIPLE_CHOICE: faqat kerak bo'lsa. options'da 3-4 variant, acceptableAnswers esa shu variantlardan biriga aynan teng bo'lsin.

Return JSON:
{
  "questions": [
    {
      "type": "SHORT_ANSWER",
      "prompt": "...",
      "options": null,
      "acceptableAnswers": ["javob 1", "javob 2"],
      "explanation": "..."
    }
  ]
}`;
}

export function normalizeQuestionType(type: string | undefined): QuestionType {
  if (type === 'NUMERIC' || type === 'MULTIPLE_CHOICE') return type;
  return 'SHORT_ANSWER';
}
