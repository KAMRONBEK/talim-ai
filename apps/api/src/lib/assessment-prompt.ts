import type { QuestionType } from '@prisma/client';

/** Styles offered by the B2C per-content quiz generator (unchanged). */
export type QuestionStyle = 'mixed' | 'multipleChoice' | 'trueFalse' | 'written' | 'numeric';

/** Styles for the B2B question-bank generator — adds the B1 + structured (B2) types. */
export type AssessmentQuestionStyle =
  | QuestionStyle
  | 'multipleSelect'
  | 'fillBlank'
  | 'dropdownCloze'
  | 'matching'
  | 'ordering';

export const ASSESSMENT_SYSTEM_PROMPT = `Siz O'zbekistondagi maktab va o'quv markazlari uchun savol banki tuzadigan metodistsiz.

Qoidalar:
- Savollar tabiiy, savodli o'zbek tilida, lotin yozuvida bo'lsin (ona tilida so'zlashuvchi o'qituvchidek — tarjima qilingandek emas).
- Kahoot/Baamboozle kabi qiziqarli, lekin javobini ko'chirish oson bo'lmagan savollar tuzing.
- Savol turlari:
  - SHORT_ANSWER: qisqa yozma javob (options: null). Javob qisqa so'z, atama yoki raqamli qiymat bo'lsin — formula, tenglama yoki uzun ifoda BO'LMASIN. Agar tabiiy javob formula/hisob natijasi bo'lsa, NUMERIC ishlating.
  - NUMERIC: raqamli javob (options: null).
  - MULTIPLE_CHOICE: 3-4 ta variant, BITTA to'g'ri javob. "acceptableAnswers" ichidagi to'g'ri javob AYNAN shu variantlardan biriga (harfma-harf) teng bo'lishi SHART. Aks holda bunday savol tuzmang.
  - TRUE_FALSE: to'g'ri/noto'g'ri savol. options AYNAN ["To'g'ri", "Noto'g'ri"] bo'lsin, acceptableAnswers shu ikkitadan bittasiga teng bo'lsin.
  - MULTIPLE_SELECT: 4-5 ta variant, KO'P to'g'ri javob (kamida 2 ta). "acceptableAnswers" ichida bir nechta to'g'ri variant bo'lsin va HAR BIRI AYNAN variantlardan biriga teng bo'lsin.
  - FILL_BLANK: gap ichidagi bo'sh joyni "___" (3 ta pastki chiziq) bilan belgilang (options: null). "acceptableAnswers" ichida shu bitta bo'sh joy uchun qabul qilinadigan javob(lar) (sinonimlar) bo'lsin. "config" ga {"blanks": 1} yozing.
  - DROPDOWN_CLOZE: FILL_BLANK kabi, lekin har bir bo'sh joy ("___") uchun tanlash ro'yxati (dropdown) bo'ladi. Har bir bo'sh joyga 2-4 ta variant bering. "config" ga {"blanks": N, "blankOptions": [[bo'sh joy 1 variantlari], [bo'sh joy 2 variantlari], ...]} yozing (blankOptions uzunligi N ga teng). "acceptableAnswers" — har bir bo'sh joy uchun BITTA to'g'ri variant, TARTIB bilan (parallel, i-chi element i-chi bo'sh joyga tegishli). Har bir to'g'ri javob shu bo'sh joyning variantlari ichida AYNAN bo'lishi SHART. options: null.
  - MATCHING: chap tomon (left) tushunchalari va o'ng tomon (right) mos javoblarini ulash. "config" ga {"left": [chap 1, chap 2, ...], "right": [o'ng variantlar to'plami — to'g'ri javoblar + qo'shimcha chalg'ituvchilar]} yozing. "acceptableAnswers" — har bir chap element uchun to'g'ri o'ng javob, TARTIB bilan (parallel, i-chi element left[i] ga mos). Kamida 2 juft bo'lsin. Har bir to'g'ri javob "right" ro'yxati ichida bo'lishi SHART. Chap elementlar takrorlanmasin. options: null.
  - ORDERING: elementlarni to'g'ri tartibda joylashtirish (masalan qadamlar, xronologiya, kattalik bo'yicha). "acceptableAnswers" — elementlar TO'G'RI TARTIBDA (birinchidan oxirigacha). Kamida 2 element, takrorlanmasin. config va options: null (tizim ularni aralashtirib ko'rsatadi).
- Agar material matni berilsa, undan foydalaning. Agar mavzu berilsa, mavzuga mos yangi savollar ham tuzing.
- TUSHUNISHNI sinang, yodlashni emas: savollar matndagi gaplarni AYNAN ko'chirmasin. O'quvchi mavzuni tushunganini sinang — qo'llash, tahlil, sabab-natija, taqqoslash, xulosa chiqarish (faqat "esda saqlash" emas).
- To'g'ri javobni matndan to'g'ridan-to'g'ri ko'chirib topib bo'lmasin; o'ylash va tushunish talab qilinsin. Savol matndagi jumlani qayta aytib bermasin.
- Chalg'ituvchi (noto'g'ri) variantlar ishonarli bo'lsin — keng tarqalgan tushunmovchiliklarga asoslangan, lekin aniq noto'g'ri.
- Har bir savolga qisqa "explanation" (tushuntirish) qo'shing.
- Return valid JSON only.`;

function styleInstruction(style: AssessmentQuestionStyle): string {
  switch (style) {
    case 'multipleChoice':
      return "BARCHA savollar MULTIPLE_CHOICE bo'lsin (har biri 3-4 ta variant, BITTA to'g'ri javob). To'g'ri javob variantlardan biriga aynan teng bo'lsin.";
    case 'trueFalse':
      return 'BARCHA savollar TRUE_FALSE turida bo\'lsin: type "TRUE_FALSE", options AYNAN ["To\'g\'ri", "Noto\'g\'ri"], acceptableAnswers shu ikkitadan biri.';
    case 'multipleSelect':
      return "BARCHA savollar MULTIPLE_SELECT bo'lsin (4-5 ta variant, kamida 2 ta to'g'ri javob). acceptableAnswers ichidagi har bir to'g'ri javob variantlardan biriga aynan teng bo'lsin.";
    case 'fillBlank':
      return 'BARCHA savollar FILL_BLANK bo\'lsin: gapdagi bo\'sh joyni "___" bilan belgilang, options: null, acceptableAnswers shu bo\'sh joy uchun javob(lar), config: {"blanks": 1}.';
    case 'dropdownCloze':
      return 'BARCHA savollar DROPDOWN_CLOZE bo\'lsin: gapdagi har bir bo\'sh joyni "___" bilan belgilang, config: {"blanks": N, "blankOptions": [[...], ...]}, acceptableAnswers har bir bo\'sh joy uchun bitta to\'g\'ri variant (tartib bilan), options: null.';
    case 'matching':
      return 'BARCHA savollar MATCHING bo\'lsin: config: {"left": [...], "right": [...]}, acceptableAnswers har bir chap element uchun to\'g\'ri o\'ng javob (tartib bilan, left ga parallel). Kamida 2 juft. options: null.';
    case 'ordering':
      return 'BARCHA savollar ORDERING bo\'lsin: acceptableAnswers elementlar to\'g\'ri tartibda (birinchidan oxirigacha). Kamida 2 element. config va options: null.';
    case 'written':
      return "BARCHA savollar SHORT_ANSWER bo'lsin (qisqa yozma javob, options: null).";
    case 'numeric':
      return "BARCHA savollar NUMERIC bo'lsin (raqamli javob, options: null). Faqat manbada haqiqiy raqamli ma'lumot bo'lsa tuzing.";
    case 'mixed':
    default:
      return "Turli xil savollardan foydalaning: ko'p tanlovli (MULTIPLE_CHOICE), to'g'ri/noto'g'ri (TRUE_FALSE), ko'p javobli (MULTIPLE_SELECT), bo'sh joyni to'ldirish (FILL_BLANK), ro'yxatdan tanlab to'ldirish (DROPDOWN_CLOZE), moslashtirish (MATCHING), tartiblash (ORDERING), qisqa yozma (SHORT_ANSWER) va, mos bo'lsa, raqamli (NUMERIC). Turlarni muvozanatli aralashtiring.";
  }
}

export function buildAssessmentPrompt(input: {
  title: string;
  topic?: string | null;
  context?: string | null;
  count: number;
  style?: AssessmentQuestionStyle;
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
    },
    {
      "type": "TRUE_FALSE",
      "prompt": "...",
      "options": ["To'g'ri", "Noto'g'ri"],
      "acceptableAnswers": ["To'g'ri"],
      "explanation": "..."
    },
    {
      "type": "MULTIPLE_SELECT",
      "prompt": "...",
      "options": ["A", "B", "C", "D", "E"],
      "acceptableAnswers": ["A", "C"],
      "explanation": "..."
    },
    {
      "type": "FILL_BLANK",
      "prompt": "... ___ ...",
      "options": null,
      "acceptableAnswers": ["to'g'ri javob", "sinonim"],
      "config": { "blanks": 1 },
      "explanation": "..."
    },
    {
      "type": "DROPDOWN_CLOZE",
      "prompt": "O'zbekiston poytaxti ___ va u ___ viloyatida joylashgan.",
      "options": null,
      "acceptableAnswers": ["Toshkent", "Toshkent"],
      "config": {
        "blanks": 2,
        "blankOptions": [["Toshkent", "Samarqand", "Buxoro"], ["Toshkent", "Farg'ona", "Xorazm"]]
      },
      "explanation": "..."
    },
    {
      "type": "MATCHING",
      "prompt": "Har bir atamani to'g'ri ta'rifi bilan moslang.",
      "options": null,
      "acceptableAnswers": ["Meva", "Sabzavot"],
      "config": {
        "left": ["Olma", "Sabzi"],
        "right": ["Meva", "Sabzavot", "Don"]
      },
      "explanation": "..."
    },
    {
      "type": "ORDERING",
      "prompt": "Suvning bug'lanish jarayoni bosqichlarini to'g'ri tartibda joylashtiring.",
      "options": null,
      "acceptableAnswers": ["Isish", "Bug'lanish", "Sovish", "Kondensatsiya"],
      "config": null,
      "explanation": "..."
    }
  ]
}`;
}

/**
 * B2C quiz normalizer — only the three types the B2C quiz storage/grading understands.
 * Anything else collapses to SHORT_ANSWER. (Do NOT widen this: the B2C quiz path in
 * quiz.controller can't grade the B2B-only types.)
 */
export function normalizeQuestionType(type: string | undefined): QuestionType {
  if (type === 'NUMERIC' || type === 'MULTIPLE_CHOICE') return type;
  return 'SHORT_ANSWER';
}

/**
 * B2B assessment normalizer — the full set including the B1 types
 * (TRUE_FALSE / MULTIPLE_SELECT / FILL_BLANK), the B2 structured types
 * (DROPDOWN_CLOZE / MATCHING / ORDERING), and the manual-authoring-only types
 * (HOTSPOT / DRAG_DROP). Used only by the tenant question-bank generator, whose
 * storage + scoring engine handle these types. HOTSPOT/DRAG_DROP are never AI-generated
 * (not in any generation style list or the mixed prompt) — they only pass through here so
 * type-normalization of an already-typed manual/edited question preserves them.
 */
export function normalizeAssessmentQuestionType(type: string | undefined): QuestionType {
  switch (type) {
    case 'NUMERIC':
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
    case 'MULTIPLE_SELECT':
    case 'FILL_BLANK':
    case 'DROPDOWN_CLOZE':
    case 'MATCHING':
    case 'ORDERING':
    case 'HOTSPOT':
    case 'DRAG_DROP':
      return type;
    default:
      return 'SHORT_ANSWER';
  }
}
