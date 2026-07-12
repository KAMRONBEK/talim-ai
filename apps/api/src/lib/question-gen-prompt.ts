import type { QuestionType } from '@prisma/client';
import type { AppLocale, QuestionDepth } from '@talim/types';
import type { AssessmentQuestionStyle } from './assessment-prompt.js';

/**
 * Unified, locale-aware question-generation prompts — used by BOTH the B2C practice-quiz
 * job and the tenant question-bank generator. Encodes evidence-based item-writing rules:
 * misconception-derived distractors (with per-option rationales), a verbatim sourceQuote
 * anchor per item (hallucination firewall), cognitive-depth control with near-transfer
 * constraints at the application level, and a hard ban list (verbatim stems, negatives,
 * always/never, all/none-of-the-above).
 */

/** Question types the AI generator may produce (HOTSPOT / DRAG_DROP are manual-only).
 * FLASHCARD is B2C-practice-only — tenant banks pass an allowedTypes set without it. */
export type GeneratableQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'MULTIPLE_SELECT'
  | 'FILL_BLANK'
  | 'DROPDOWN_CLOZE'
  | 'MATCHING'
  | 'ORDERING'
  | 'SHORT_ANSWER'
  | 'NUMERIC'
  | 'FLASHCARD';

export const GENERATABLE_TYPES: GeneratableQuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MULTIPLE_SELECT',
  'FILL_BLANK',
  'DROPDOWN_CLOZE',
  'MATCHING',
  'ORDERING',
  'SHORT_ANSWER',
  'NUMERIC',
  'FLASHCARD',
];

/** Legacy single-style knob → explicit type set (null = balanced default mix). */
export function typesFromStyle(style: AssessmentQuestionStyle): GeneratableQuestionType[] | null {
  switch (style) {
    case 'multipleChoice':
      return ['MULTIPLE_CHOICE'];
    case 'trueFalse':
      return ['TRUE_FALSE'];
    case 'multipleSelect':
      return ['MULTIPLE_SELECT'];
    case 'fillBlank':
      return ['FILL_BLANK'];
    case 'dropdownCloze':
      return ['DROPDOWN_CLOZE'];
    case 'matching':
      return ['MATCHING'];
    case 'ordering':
      return ['ORDERING'];
    case 'written':
      return ['SHORT_ANSWER'];
    case 'numeric':
      return ['NUMERIC'];
    case 'mixed':
    default:
      return null;
  }
}

/**
 * B2C practice normalizer — the unified engine's full generatable set. HOTSPOT/DRAG_DROP
 * (manual-authoring, tenant-only) collapse to SHORT_ANSWER, as does anything unknown.
 */
export function normalizePracticeQuestionType(type: string | undefined): QuestionType {
  switch (type) {
    case 'NUMERIC':
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
    case 'MULTIPLE_SELECT':
    case 'FILL_BLANK':
    case 'DROPDOWN_CLOZE':
    case 'MATCHING':
    case 'ORDERING':
    case 'FLASHCARD':
      return type;
    default:
      return 'SHORT_ANSWER';
  }
}

const TRUE_FALSE_OPTIONS: Record<AppLocale, [string, string]> = {
  uz: ["To'g'ri", "Noto'g'ri"],
  en: ['True', 'False'],
  ru: ['Верно', 'Неверно'],
};

/** Locale-native names for each type, used in the type-requirement instruction line. */
const TYPE_NAMES: Record<AppLocale, Record<GeneratableQuestionType, string>> = {
  uz: {
    MULTIPLE_CHOICE: "ko'p tanlovli (MULTIPLE_CHOICE)",
    TRUE_FALSE: "to'g'ri/noto'g'ri (TRUE_FALSE)",
    MULTIPLE_SELECT: "ko'p javobli (MULTIPLE_SELECT)",
    FILL_BLANK: "bo'sh joyni to'ldirish (FILL_BLANK)",
    DROPDOWN_CLOZE: "ro'yxatdan tanlab to'ldirish (DROPDOWN_CLOZE)",
    MATCHING: 'moslashtirish (MATCHING)',
    ORDERING: 'tartiblash (ORDERING)',
    SHORT_ANSWER: 'qisqa yozma (SHORT_ANSWER)',
    NUMERIC: 'raqamli (NUMERIC)',
    FLASHCARD: 'fleshkarta (FLASHCARD)',
  },
  en: {
    MULTIPLE_CHOICE: 'multiple choice (MULTIPLE_CHOICE)',
    TRUE_FALSE: 'true/false (TRUE_FALSE)',
    MULTIPLE_SELECT: 'multiple select (MULTIPLE_SELECT)',
    FILL_BLANK: 'fill in the blank (FILL_BLANK)',
    DROPDOWN_CLOZE: 'dropdown cloze (DROPDOWN_CLOZE)',
    MATCHING: 'matching (MATCHING)',
    ORDERING: 'ordering (ORDERING)',
    SHORT_ANSWER: 'short written answer (SHORT_ANSWER)',
    NUMERIC: 'numeric (NUMERIC)',
    FLASHCARD: 'flashcard (FLASHCARD)',
  },
  ru: {
    MULTIPLE_CHOICE: 'с выбором ответа (MULTIPLE_CHOICE)',
    TRUE_FALSE: 'верно/неверно (TRUE_FALSE)',
    MULTIPLE_SELECT: 'с несколькими ответами (MULTIPLE_SELECT)',
    FILL_BLANK: 'заполнить пропуск (FILL_BLANK)',
    DROPDOWN_CLOZE: 'пропуск со списком (DROPDOWN_CLOZE)',
    MATCHING: 'сопоставление (MATCHING)',
    ORDERING: 'упорядочивание (ORDERING)',
    SHORT_ANSWER: 'краткий письменный ответ (SHORT_ANSWER)',
    NUMERIC: 'числовой (NUMERIC)',
    FLASHCARD: 'флеш-карта (FLASHCARD)',
  },
};

/**
 * Per-type structural contract. Locale-independent apart from the TRUE_FALSE option labels,
 * so it is written once with the labels substituted (the model writes CONTENT in the target
 * language per the system prompt).
 */
function typeRules(locale: AppLocale): string {
  const [tfTrue, tfFalse] = TRUE_FALSE_OPTIONS[locale];
  return `Question type contracts (structural — follow EXACTLY):
- SHORT_ANSWER: short written answer (options: null). The answer must be a short word, term, or value — never a formula or long expression. Put every accepted synonym/variant in "acceptableAnswers".
- NUMERIC: numeric answer (options: null). Only when the source contains real numeric facts. "acceptableAnswers" holds the canonical number (digits, dot decimal).
- MULTIPLE_CHOICE: 4 options, exactly ONE correct. The correct answer in "acceptableAnswers" MUST equal one option character-for-character.
- TRUE_FALSE: options EXACTLY ["${tfTrue}", "${tfFalse}"]; acceptableAnswers = one of the two. The statement must be a PARAPHRASE, never a copied sentence (or a copied sentence with one word negated).
- MULTIPLE_SELECT: 4-5 options, at least 2 correct; every accepted answer MUST equal one option exactly.
- FILL_BLANK: mark the blank with "___" (options: null); acceptableAnswers = accepted value(s) for that ONE blank; config: {"blanks": 1}. Exactly one blank per item — never delete a trivial word, never blank the first word.
- DROPDOWN_CLOZE: like FILL_BLANK but each "___" has a dropdown; config: {"blanks": N, "blankOptions": [[...], ...]} (length N); acceptableAnswers = one correct choice per blank IN ORDER, each present in its blank's options. options: null.
- MATCHING: config: {"left": [...], "right": [correct answers + extra distractors]}; acceptableAnswers = the correct right value per left item IN ORDER (parallel to left). At least 2 pairs; include 1-2 extra right-side distractors so the last pair can't be won by elimination. options: null.
- ORDERING: acceptableAnswers = the items in CORRECT order (first to last), at least 3 distinct items. config and options: null (the system shuffles the display order).
- FLASHCARD: a two-sided study card. "prompt" = the FRONT (one focused term, concept, or question); "acceptableAnswers" = [the BACK: a concise, complete answer or definition]. options and config: null.

MATH NOTATION: write every mathematical expression, formula, or equation in LaTeX inside dollar delimiters — inline as $...$ (e.g. $S = 2\\pi r$), display as $$...$$. Never emit raw LaTeX without the delimiters and never use unicode superscripts; plain numbers in running text stay plain.`;
}

const SYSTEM_PROMPTS: Record<AppLocale, (rules: string) => string> = {
  uz: (rules) => `Siz O'zbekistondagi maktab va o'quv markazlari uchun ilmiy asoslangan test savollarini tuzadigan tajribali metodistsiz.

TIL SIFATI: Savollar tabiiy, savodli o'zbek tilida, lotin yozuvida bo'lsin — ona tilida so'zlashuvchi o'qituvchidek, tarjima qilingandek emas. Atamalarni darslikdagidek ishlating.

${rules}

SAVOL SIFATI QOIDALARI (majburiy):
- Savol matni (stem) variantlarsiz ham tushunarli, to'liq savol bo'lsin — o'quvchi variantlarni ko'rmasdan javobni o'ylab topa olsin.
- Har bir savol BITTA tushunchani sinasin.
- Inkor savollar TUZMANG ("qaysi biri EMAS..." taqiqlanadi). "Har doim", "hech qachon", "barchasi to'g'ri", "hech biri" kabi variantlar TAQIQLANADI.
- Variantlar grammatik jihatdan parallel va uzunligi o'xshash bo'lsin; to'g'ri javob eng uzun variant BO'LMASIN.
- Savol matndagi gapni AYNAN ko'chirmasin: 5+ so'zlik ketma-ket parcha manbadan ko'chirilgan bo'lsa, savol RAD ETILADI. O'z so'zlaringiz bilan qayta ifodalang.
- CHALG'ITUVCHILAR: har bir noto'g'ri variant o'quvchining REAL xatosiga asoslansin (tushunchalarni aralashtirish, qoidani noto'g'ri qo'llash, ishorani/birlikni adashtirish). Har bir noto'g'ri variant uchun "optionRationales" ga NEGA bu xato ekanini qisqa yozing (to'g'ri variant o'rniga null).
- HAR BIR savolga "sourceQuote" qo'shing: to'g'ri javobni isbotlaydigan jumla MATERIALDAN AYNAN (harfma-harf) ko'chirilsin.
- HAR BIR savolga "difficulty" yozing: "easy" (bitta jumladan topiladigan fakt), "medium" (2+ jumlani bog'lash yoki qayta ifodalangan holatni tanish), "hard" (tushunchani yangi vaziyatga qo'llash yoki ko'p bosqichli fikrlash).
- HAR BIR savolga "bloom" yozing: "recall" (eslash), "understanding" (tushunish), "application" (qo'llash).
- Har bir savolga qisqa "explanation" (nima uchun shu javob to'g'ri) qo'shing.
- Return valid JSON only.`,
  en: (rules) => `You are an experienced assessment writer producing evidence-based test items for a learning platform.

LANGUAGE QUALITY: Write all question content in natural, correct English at the level of the source material.

${rules}

ITEM-WRITING RULES (mandatory):
- The stem must be a complete, self-contained question answerable BEFORE seeing the options.
- Each item tests exactly ONE concept.
- NO negative stems ("which is NOT..."). Options containing "always", "never", "all of the above", "none of the above" are BANNED.
- Options must be grammatically parallel and of similar length; the key must NOT be the longest option.
- Never copy sentences from the source: any 5+ consecutive words lifted verbatim gets the item REJECTED. Rephrase in your own words.
- DISTRACTORS: derive each wrong option from a REAL, named learner error (confusing two concepts, applying a rule to the wrong case, sign/unit slips). For each wrong option write WHY it is wrong into "optionRationales" (null in the correct option's slot).
- EVERY item must carry "sourceQuote": a sentence copied VERBATIM from the material that proves the correct answer.
- EVERY item declares "difficulty": "easy" (single stated fact), "medium" (connect/paraphrase 2+ statements), "hard" (apply the concept to an unseen case or multi-step reasoning).
- EVERY item declares "bloom": "recall", "understanding", or "application".
- Add a short "explanation" (why the correct answer is correct).
- Return valid JSON only.`,
  ru: (rules) => `Вы опытный методист, составляющий научно обоснованные тестовые задания для учебной платформы.

КАЧЕСТВО ЯЗЫКА: Пишите все содержимое вопросов на естественном, грамотном русском языке, на уровне исходного материала.

${rules}

ПРАВИЛА КАЧЕСТВА (обязательные):
- Формулировка вопроса должна быть полной и понятной ДО просмотра вариантов ответа.
- Каждое задание проверяет ровно ОДНО понятие.
- БЕЗ отрицательных формулировок («что из этого НЕ...»). Варианты со словами «всегда», «никогда», «все вышеперечисленное», «ничего из перечисленного» ЗАПРЕЩЕНЫ.
- Варианты грамматически параллельны и близки по длине; правильный ответ НЕ должен быть самым длинным.
- Не копируйте предложения из источника: задание с 5+ подряд совпадающими словами будет ОТКЛОНЕНО. Переформулируйте своими словами.
- ДИСТРАКТОРЫ: каждый неверный вариант должен вытекать из РЕАЛЬНОЙ ошибки ученика (путает понятия, применяет правило не к тому случаю, ошибка в знаке/единицах). Для каждого неверного варианта запишите в "optionRationales", ПОЧЕМУ он неверен (null на месте правильного).
- КАЖДОЕ задание содержит "sourceQuote": предложение, ДОСЛОВНО скопированное из материала и подтверждающее правильный ответ.
- КАЖДОЕ задание объявляет "difficulty": "easy" (факт из одного предложения), "medium" (связать/переформулировать 2+ утверждения), "hard" (применить понятие к новой ситуации или многошаговое рассуждение).
- КАЖДОЕ задание объявляет "bloom": "recall", "understanding" или "application".
- Добавьте короткое "explanation" (почему верный ответ верен).
- Return valid JSON only.`,
};

export function getQuestionGenSystemPrompt(locale: AppLocale): string {
  return SYSTEM_PROMPTS[locale](typeRules(locale));
}

/** Depth requirement lines, with near-transfer constraints at understanding/application. */
const DEPTH_INSTRUCTIONS: Record<AppLocale, Record<Exclude<QuestionDepth, 'mixed'>, string>> = {
  uz: {
    recall:
      "CHUQURLIK — ESLASH (recall): aniq fakt, atama yoki ta'rifni so'rang (aniqlang/sanab bering/qaysi). bloom: \"recall\".",
    understanding:
      'CHUQURLIK — TUSHUNISH (understanding): tushuntirish, taqqoslash, tasniflash yoki QAYTA IFODALANGAN holatni tanishni talab qiling (nega/qanday/taqqoslang). Savol manba jumlasini takrorlamasin — o\'quvchi yod olgan matn bilan emas, tushunish bilan javob bersin. bloom: "understanding".',
    application:
      'CHUQURLIK — QO\'LLASH (application): tushunchani MANBADA YO\'Q yangi vaziyat, misol yoki raqamlarga qo\'llashni talab qiling: yangi ism, yangi son, yangi kontekst O\'YLAB TOPING. Javob baribir faqat manbadagi tushunchadan kelib chiqsin (tashqi bilim talab qilinmasin). Matndan 5+ so\'zlik parcha ishlatish TAQIQLANADI. bloom: "application".',
  },
  en: {
    recall:
      'DEPTH — RECALL: ask for a specific fact, term, or definition (define/list/state/which). bloom: "recall".',
    understanding:
      'DEPTH — UNDERSTANDING: require explaining, comparing, classifying, or recognizing a RESTATED instance (why/how/compare). The question must not echo source sentences — a learner must answer from understanding, not from memorized wording. bloom: "understanding".',
    application:
      'DEPTH — APPLICATION (near transfer): require applying the concept to a NEW scenario, example, or numbers NOT present in the source — invent new names, values, contexts. The answer must still be fully derivable from the source concept alone (no outside knowledge). Reusing any 5+ word phrase from the source is FORBIDDEN. bloom: "application".',
  },
  ru: {
    recall:
      'ГЛУБИНА — ПРИПОМИНАНИЕ (recall): спросите конкретный факт, термин или определение (назовите/перечислите/какой). bloom: "recall".',
    understanding:
      'ГЛУБИНА — ПОНИМАНИЕ (understanding): требуйте объяснить, сравнить, классифицировать или узнать ПЕРЕФОРМУЛИРОВАННЫЙ случай (почему/как/сравните). Вопрос не должен повторять предложения источника. bloom: "understanding".',
    application:
      'ГЛУБИНА — ПРИМЕНЕНИЕ (application): требуйте применить понятие к НОВОЙ ситуации, примеру или числам, которых НЕТ в источнике — придумайте новые имена, значения, контексты. Ответ должен выводиться только из понятия в источнике (без внешних знаний). Использовать фразы из 5+ слов источника ЗАПРЕЩЕНО. bloom: "application".',
  },
};

const MIXED_DEPTH: Record<AppLocale, string> = {
  uz: "CHUQURLIK — ARALASH: taxminan 30% eslash (recall), 40% tushunish (understanding), 30% qo'llash (application) savollari tuzing. Har birining talablari: ",
  en: 'DEPTH — MIXED: produce roughly 30% recall, 40% understanding, 30% application items. Per-level requirements: ',
  ru: 'ГЛУБИНА — СМЕШАННАЯ: составьте примерно 30% recall, 40% understanding, 30% application. Требования к уровням: ',
};

function depthInstruction(locale: AppLocale, depth: QuestionDepth): string {
  const levels = DEPTH_INSTRUCTIONS[locale];
  if (depth === 'mixed') {
    return `${MIXED_DEPTH[locale]}\n- ${levels.recall}\n- ${levels.understanding}\n- ${levels.application}`;
  }
  return levels[depth];
}

const TYPES_REQUIREMENT: Record<AppLocale, (names: string) => string> = {
  uz: (names) => `Savol turlari bo'yicha talab: FAQAT quyidagi turlardan foydalaning va ularni muvozanatli taqsimlang: ${names}.`,
  en: (names) => `Question-type requirement: use ONLY these types, distributed in a balanced way: ${names}.`,
  ru: (names) => `Требование к типам вопросов: используйте ТОЛЬКО эти типы, распределяя их равномерно: ${names}.`,
};

const DEFAULT_MIX_TYPES: GeneratableQuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'MULTIPLE_SELECT',
  'FILL_BLANK',
  'DROPDOWN_CLOZE',
  'MATCHING',
  'ORDERING',
  'SHORT_ANSWER',
  'NUMERIC',
];

const CONTEXT_LABELS: Record<
  AppLocale,
  { source: string; topic: string; fromMaterial: string; noContext: string; makeCount: (n: number) => string }
> = {
  uz: {
    source: 'Material (manba matn)',
    topic: 'Mavzu',
    fromMaterial: 'Material asosida',
    noContext: "Kontekst berilmagan. Mavzu bo'yicha yangi, aloqador savollar tuzing.",
    makeCount: (n) => `${n} ta savol tuzing.`,
  },
  en: {
    source: 'Material (source text)',
    topic: 'Topic',
    fromMaterial: 'Based on the material',
    noContext: 'No context provided. Write fresh, relevant questions on the topic.',
    makeCount: (n) => `Write ${n} questions.`,
  },
  ru: {
    source: 'Материал (исходный текст)',
    topic: 'Тема',
    fromMaterial: 'На основе материала',
    noContext: 'Контекст не задан. Составьте новые вопросы по теме.',
    makeCount: (n) => `Составьте ${n} вопросов.`,
  },
};

const AVOID_STEMS_LABEL: Record<AppLocale, string> = {
  uz: "Quyidagi savollar ALLAQACHON tuzilgan — ularni TAKRORLAMANG va yaqin ma'noda qayta ifodalamang; BOSHQA fakt va tushunchalarni sinang:",
  en: 'These questions ALREADY exist — do NOT repeat or closely paraphrase any of them; test DIFFERENT facts and concepts:',
  ru: 'Эти вопросы УЖЕ составлены — НЕ повторяйте и не перефразируйте их; проверяйте ДРУГИЕ факты и понятия:',
};

export interface QuestionGenPromptInput {
  title: string;
  topic?: string | null;
  context?: string | null;
  /** How many items to REQUEST from the model (callers overgenerate ~1.5x, then filter+trim). */
  count: number;
  types?: GeneratableQuestionType[] | null;
  depth: QuestionDepth;
  /** Stems already kept from a previous pass — the fill-to-count retry must not repeat them. */
  avoidStems?: string[];
}

export function buildQuestionGenPrompt(locale: AppLocale, input: QuestionGenPromptInput): string {
  const labels = CONTEXT_LABELS[locale];
  const names = TYPE_NAMES[locale];
  const types = input.types && input.types.length > 0 ? input.types : DEFAULT_MIX_TYPES;
  const typeLine = TYPES_REQUIREMENT[locale](types.map((t) => names[t]).join(', '));
  const avoidBlock =
    input.avoidStems && input.avoidStems.length > 0
      ? `\n${AVOID_STEMS_LABEL[locale]}\n${input.avoidStems.map((s) => `- ${s}`).join('\n')}\n`
      : '';

  return `${labels.topic}: ${input.topic ?? labels.fromMaterial}
${labels.source} — ${input.title}:
${input.context ?? labels.noContext}
${avoidBlock}
${labels.makeCount(input.count)}
${typeLine}
${depthInstruction(locale, input.depth)}

Return JSON:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "prompt": "...",
      "options": ["...", "...", "...", "..."],
      "acceptableAnswers": ["<exactly one of options>"],
      "optionRationales": [null, "<why this wrong option tempts a learner>", "<...>", "<...>"],
      "config": null,
      "explanation": "...",
      "sourceQuote": "<verbatim sentence from the material proving the answer>",
      "difficulty": "easy|medium|hard",
      "bloom": "recall|understanding|application"
    },
    {
      "type": "DROPDOWN_CLOZE",
      "prompt": "... ___ ... ___ ...",
      "options": null,
      "acceptableAnswers": ["<blank 1 correct>", "<blank 2 correct>"],
      "optionRationales": null,
      "config": { "blanks": 2, "blankOptions": [["...", "..."], ["...", "..."]] },
      "explanation": "...",
      "sourceQuote": "...",
      "difficulty": "medium",
      "bloom": "understanding"
    },
    {
      "type": "MATCHING",
      "prompt": "...",
      "options": null,
      "acceptableAnswers": ["<right for left[0]>", "<right for left[1]>"],
      "optionRationales": null,
      "config": { "left": ["...", "..."], "right": ["...", "...", "<extra distractor>"] },
      "explanation": "...",
      "sourceQuote": "...",
      "difficulty": "medium",
      "bloom": "understanding"
    }
  ]
}
All other types follow the same shape (ORDERING: acceptableAnswers in correct order, config null; FILL_BLANK: config {"blanks": 1}; TRUE_FALSE/MULTIPLE_SELECT: options + matching acceptableAnswers; SHORT_ANSWER/NUMERIC: options null).`;
}
