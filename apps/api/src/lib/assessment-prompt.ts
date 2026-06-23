import type { QuestionType } from '@prisma/client';

export type QuestionStyle = 'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric';

export const ASSESSMENT_SYSTEM_PROMPT = `Siz O'zbekistondagi maktab va o'quv markazlari uchun savol banki tuzadigan metodistsiz.

Qoidalar:
- Savollar tabiiy, savodli o'zbek tilida, lotin yozuvida bo'lsin (ona tilida so'zlashuvchi o'qituvchidek — tarjima qilingandek emas).
- Kahoot/Baamboozle kabi qiziqarli, lekin javobini ko'chirish oson bo'lmagan savollar tuzing.
- Savol turlari:
  - SHORT_ANSWER: qisqa yozma javob (options: null). Javob qisqa so'z, atama yoki raqamli qiymat bo'lsin — formula, tenglama yoki uzun ifoda BO'LMASIN. Agar tabiiy javob formula/hisob natijasi bo'lsa, NUMERIC ishlating.
  - NUMERIC: raqamli javob (options: null).
  - MULTIPLE_CHOICE: 3-4 ta variant. "acceptableAnswers" ichidagi to'g'ri javob AYNAN shu variantlardan biriga (harfma-harf) teng bo'lishi SHART. Aks holda bunday savol tuzmang.
  - To'g'ri/Noto'g'ri savol = MULTIPLE_CHOICE bo'lib, options AYNAN ["To'g'ri", "Noto'g'ri"] bo'lsin va acceptableAnswers shu ikkitadan biriga teng bo'lsin.
- Agar material matni berilsa, undan foydalaning. Agar mavzu berilsa, mavzuga mos yangi savollar ham tuzing.
- Har bir savolga qisqa "explanation" (tushuntirish) qo'shing.
- Return valid JSON only.`;

function styleInstruction(style: QuestionStyle): string {
  switch (style) {
    case 'multipleChoice':
      return "BARCHA savollar MULTIPLE_CHOICE bo'lsin (har biri 3-4 ta variant). To'g'ri javob variantlardan biriga aynan teng bo'lsin.";
    case 'trueFalse':
      return 'BARCHA savollar to\'g\'ri/noto\'g\'ri turida bo\'lsin: type "MULTIPLE_CHOICE", options AYNAN ["To\'g\'ri", "Noto\'g\'ri"], acceptableAnswers shu ikkitadan biri.';
    case 'written':
      return "BARCHA savollar SHORT_ANSWER bo'lsin (qisqa yozma javob, options: null).";
    case 'numeric':
      return "BARCHA savollar NUMERIC bo'lsin (raqamli javob, options: null). Faqat manbada haqiqiy raqamli ma'lumot bo'lsa tuzing.";
    case 'mixed':
    default:
      return "Turli xil savollardan foydalaning: ko'p tanlovli (MULTIPLE_CHOICE), to'g'ri/noto'g'ri (2 variantli MULTIPLE_CHOICE), qisqa yozma (SHORT_ANSWER) va, mos bo'lsa, raqamli (NUMERIC). Turlarni muvozanatli aralashtiring.";
  }
}

export function buildAssessmentPrompt(input: {
  title: string;
  topic?: string | null;
  context?: string | null;
  count: number;
  style?: QuestionStyle;
}): string {
  return `Savol banki: ${input.title}
Mavzu: ${input.topic ?? 'Material asosida'}

Material yoki kontekst:
${input.context ?? "Kontekst berilmagan. Mavzu bo'yicha yangi, aloqador savollar tuzing."}

${input.count} ta savol tuzing.
Savol turi bo'yicha talab: ${styleInstruction(input.style ?? 'mixed')}

Return JSON:
{
  "questions": [
    {
      "type": "SHORT_ANSWER",
      "prompt": "...",
      "options": null,
      "acceptableAnswers": ["javob 1", "javob 2"],
      "explanation": "..."
    },
    {
      "type": "MULTIPLE_CHOICE",
      "prompt": "...",
      "options": ["A", "B", "C", "D"],
      "acceptableAnswers": ["A"],
      "explanation": "..."
    }
  ]
}`;
}

export function normalizeQuestionType(type: string | undefined): QuestionType {
  if (type === 'NUMERIC' || type === 'MULTIPLE_CHOICE') return type;
  return 'SHORT_ANSWER';
}
