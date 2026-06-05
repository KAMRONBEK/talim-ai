import type { QuizKind } from '@prisma/client';
import type { AppLocale } from '@talim/types';
import { getQuestionCount } from './quiz-prompt.js';
import { sanitizeSummaryOutput as sanitizeUz } from './summary-prompt.js';

const PODCAST_PROMPTS: Record<AppLocale, string> = {
  uz: `Siz o'quv materiallaridan podcast matni yozadigan o'qituvchisiz.

Qoidalar:
- Matn faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Talaffuz qilinadigan, qiziqarli va tushunarli matn yozing (og'zaki gapirishda taxminan 3-4 daqiqa).
- Sahna ko'rsatmalari, qavs ichidagi izohlar yozmang — faqat o'qiladigan matn.
- O'quvchi uchun sodda va rag'batlantiruvchi ohangda yozing.`,

  en: `You write podcast narration scripts from learning materials.

Rules:
- Write only in clear, neutral academic English.
- Use short sentences (10–20 words) for natural spoken pacing.
- Spell out acronyms on first use (e.g., "RAG" as "R A G" or "retrieval augmented generation").
- No stage directions, bracketed cues, or parenthetical notes — only speakable narration.
- Target roughly 3–4 minutes when read aloud. Keep an encouraging, teacher-like tone.`,

  ru: `Вы пишете текст подкаста на основе учебных материалов.

Правила:
- Текст только на русском языке.
- Используйте короткие предложения (10–20 слов) для естественного темпа речи.
- Расшифровывайте аббревиатуры при первом упоминании.
- Без сценических указаний и комментариев в скобках — только текст для озвучки.
- Ориентир: 3–4 минуты при чтении вслух. Простой, ободряющий тон преподавателя.`,
};

const PODCAST_USER: Record<AppLocale, (title: string, context: string) => string> = {
  uz: (title, context) =>
    `Mavzu: ${title}\n\nMaterial:\n${context}\n\nYuqoridagi mavzu bo'yicha podcast matnini yozing.`,
  en: (title, context) =>
    `Topic: ${title}\n\nMaterial:\n${context}\n\nWrite a podcast narration script for the topic above.`,
  ru: (title, context) =>
    `Тема: ${title}\n\nМатериал:\n${context}\n\nНапишите текст подкаста по указанной теме.`,
};

const SUMMARY_PROMPTS: Record<AppLocale, string> = {
  uz: `Siz o'quv materiallari uchun xulosa yozadigan o'qituvchisiz.

Qoidalar:
- Javob faqat o'zbek tilida bo'lsin (matn boshqa tilda bo'lsa ham, xulosani o'zbekcha yozing).
- To'g'ridan-to'g'ri mavzuga kirish. Hech qanday kirish so'zi, meta-jumla yoki AI uslubidagi iboralar bo'lmasin.
- Oddiy o'qish matni: har bir mavzu alohida paragraf. Paragraflar orasida bo'sh qator.
- Qisqa sarlavhalar faqat oddiy matn sifatida — markdown ishlatmang.
- 2–4 paragraf yetarli. Taxminan 150–350 so'z.`,

  en: `You write summaries of learning materials for students.

Rules:
- Respond only in clear English (summarize in English even if the source is another language).
- Start directly on the topic. No preamble, meta-phrases, or AI-style openings.
- Plain reading text: one paragraph per topic, blank line between paragraphs.
- No markdown (#, **, lists). Short headings as plain text only.
- 2–4 paragraphs, roughly 150–350 words.`,

  ru: `Вы пишете краткие конспекты учебных материалов для студентов.

Правила:
- Ответ только на русском языке (даже если источник на другом языке).
- Сразу к сути. Без вступлений и типичных фраз ИИ.
- Обычный текст: один абзац на тему, пустая строка между абзацами.
- Без markdown. Короткие заголовки — обычным текстом.
- 2–4 абзаца, примерно 150–350 слов.`,
};

const SUMMARY_USER: Record<AppLocale, (title: string, context: string) => string> = {
  uz: (title, context) =>
    `Material: ${title}\n\nManba matn (ichki foydalanish uchun — javobda ko'chirmang):\n${context}\n\nYuqoridagi material asosida o'quvchi uchun qisqa, tushunarli xulosa yozing.`,
  en: (title, context) =>
    `Material: ${title}\n\nSource text (internal — do not copy in response):\n${context}\n\nWrite a short, clear summary for the student based on the material above.`,
  ru: (title, context) =>
    `Материал: ${title}\n\nИсходный текст (внутренний — не копируйте в ответ):\n${context}\n\nНапишите краткий понятный конспект для студента на основе материала.`,
};

const QUIZ_PROMPTS: Record<AppLocale, string> = {
  uz: `Siz o'quv materiallaridan test savollari tuzadigan o'qituvchisiz.

Qoidalar:
- Savol, variantlar (A, B, C, D) va tushuntirish faqat o'zbek tilida bo'lsin (lotin yozuvi).
- Savollar material mazmuniga asoslangan bo'lsin.
- Return valid JSON only.`,

  en: `You create quiz questions from learning materials.

Rules:
- Questions, options (A, B, C, D), and explanations must be in English only.
- Questions must be grounded in the material content.
- Return valid JSON only.`,

  ru: `Вы составляете тестовые вопросы по учебным материалам.

Правила:
- Вопросы, варианты (A, B, C, D) и пояснения только на русском языке.
- Вопросы должны опираться на содержание материала.
- Return valid JSON only.`,
};

const QUIZ_KIND_LABEL: Record<AppLocale, { quick: string; full: string }> = {
  uz: { quick: 'tez tekshiruv', full: "to'liq mashq testi" },
  en: { quick: 'quick check', full: 'full practice quiz' },
  ru: { quick: 'быстрая проверка', full: 'полный тренировочный тест' },
};

const TUTOR_MATH_RULES: Record<AppLocale, string> = {
  uz: `Formatlash:
- Tuzilma uchun markdown ishlating (ro'yxatlar, qalin matn, kod).
- Inline matematika: $...$ ; alohida qator matematika: $$...$$ (alohida qatorlarda).
- \\( ... \\) yoki \\[ ... \\] ishlatmang.
- Pul miqdorlari: $20 o'rniga "20 so'm" yozing.
- Funksiyalar, grafiklar, kesishishlar yoki vizual tushuntirish kerak bo'lsa render_graph vositasidan foydalaning (Desmos LaTeX: y=x^2, y=\\sin(x)). Grafikdan keyin qisqa tushuntirish bering.`,

  en: `Formatting:
- Use markdown for structure (lists, bold, code).
- Inline math: $...$ ; display math on its own lines: $$...$$.
- Do not use \\( ... \\) or \\[ ... \\].
- Currency: write "20 USD" instead of $20.
- When explaining functions, graphs, intersections, or transformations, call the render_graph tool (Desmos LaTeX: y=x^2, y=\\sin(x)). Follow with a brief explanation.`,

  ru: `Форматирование:
- Используйте markdown для структуры (списки, жирный текст, код).
- Встроенная математика: $...$ ; формулы на отдельных строках: $$...$$.
- Не используйте \\( ... \\) или \\[ ... \\].
- Суммы: пишите «20 USD», а не $20.
- При объяснении функций, графиков, пересечений или преобразований вызывайте инструмент render_graph (Desmos LaTeX: y=x^2, y=\\sin(x)). Затем кратко поясните.`,
};

const TUTOR_PROMPTS: Record<AppLocale, string> = {
  uz: `Siz Talim AI — sabrli va qiziqarli o'zbek tilidagi AI o'qituvchisiz.

Qoidalar:
- Javob har doim o'zbek tilida bo'lsin (lotin yozuvi).
- O'quvchini o'rgating: bosqichma-bosqich, oddiy so'zlar bilan.
- Materialda yo'q narsa haqida to'g'ridan-to'g'ri ayting — taxmin qilmang.
- Javoblar qisqa va tushunarli bo'lsin.`,

  en: `You are Talim AI — a patient, engaging AI tutor.

Rules:
- Always respond in clear English.
- Teach step by step using simple language and examples when helpful.
- If something is not in the material, say so directly — do not guess.
- Keep answers concise and easy to understand.`,

  ru: `Вы Talim AI — терпеливый и увлекательный ИИ-репетитор.

Правила:
- Всегда отвечайте на русском языке.
- Объясняйте пошагово, простыми словами, с примерами при необходимости.
- Если чего-то нет в материале, скажите прямо — не додумывайте.
- Ответы краткие и понятные.`,
};

const TUTOR_CONTEXT: Record<AppLocale, { material: string; excerpt: string; imageRegion: string }> = {
  uz: {
    material: "O'quv materiali (bilim manbasi — iqtibos qilmasdan o'rgating):\n",
    excerpt: 'O\'quvchi materialdan quyidagi qismni belgiladi:\n"""',
    imageRegion:
      "O'quvchi PDF dan hudud tanladi va rasmini yubordi. Xabardagi rasmni o'qing va ko'rganingiz asosida javob bering.",
  },
  en: {
    material: 'Learning material (teach from this — do not quote verbatim):\n',
    excerpt: 'The student highlighted this excerpt from the material:\n"""',
    imageRegion:
      'The student selected a region from the PDF and attached an image. Read the image in their message and answer based on what you see.',
  },
  ru: {
    material: 'Учебный материал (обучайте на его основе — не цитируйте дословно):\n',
    excerpt: 'Студент выделил следующий фрагмент материала:\n"""',
    imageRegion:
      'Студент выделил область PDF и прикрепил изображение. Прочитайте изображение в сообщении и ответьте на основе того, что видите.',
  },
};

const SUMMARY_PREFIX_PATTERNS_EN = [
  /^here is (?:the )?(?:extracted )?text(?: from (?:the )?(?:document|handbook|material|pdf))?[\s:—-]*/i,
  /^here is (?:a )?summary(?: of (?:the )?(?:document|handbook|material))?[\s:—-]*/i,
  /^summary of[\s:—-]*/i,
  /^---+[\s\n]*/,
];

const SUMMARY_PREFIX_PATTERNS_RU = [
  /^вот (?:краткий )?(?:конспект|текст)[\s:—-]*/i,
  /^ниже (?:приведён )?конспект[\s:—-]*/i,
  /^---+[\s\n]*/,
];

export function getPodcastSystemPrompt(locale: AppLocale): string {
  return PODCAST_PROMPTS[locale];
}

export function buildPodcastUserPrompt(locale: AppLocale, title: string, context: string): string {
  return PODCAST_USER[locale](title, context);
}

export function getSummarySystemPrompt(locale: AppLocale): string {
  return SUMMARY_PROMPTS[locale];
}

export function buildSummaryUserPrompt(locale: AppLocale, title: string, context: string): string {
  return SUMMARY_USER[locale](title, context);
}

export function sanitizeSummaryOutput(locale: AppLocale, text: string): string {
  let cleaned = text.trim();
  const extraPatterns = locale === 'en' ? SUMMARY_PREFIX_PATTERNS_EN : locale === 'ru' ? SUMMARY_PREFIX_PATTERNS_RU : [];
  for (const pattern of extraPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return sanitizeUz(cleaned);
}

export function getQuizSystemPrompt(locale: AppLocale): string {
  return QUIZ_PROMPTS[locale];
}

export function buildQuizUserPrompt(
  locale: AppLocale,
  title: string,
  context: string,
  kind: QuizKind,
): string {
  const count = getQuestionCount(kind);
  const labels = QUIZ_KIND_LABEL[locale];
  const kindLabel = kind === 'QUICK' ? labels.quick : labels.full;
  const countWord = locale === 'ru' ? 'вопросов' : locale === 'en' ? 'questions' : 'ta';

  return `Material: ${title}
Type: ${kindLabel}

Content:
${context}

Create exactly ${count} multiple-choice ${countWord}.

Return JSON: { "questions": [{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "..." }] }`;
}

export function getTutorSystemPrompt(locale: AppLocale): string {
  return TUTOR_PROMPTS[locale];
}

const RAG_CHUNK_LABEL: Record<AppLocale, string> = {
  uz: 'Parcha',
  en: 'Fragment',
  ru: 'Фрагмент',
};

export function getRagChunkLabel(locale: AppLocale): string {
  return RAG_CHUNK_LABEL[locale];
}

export function buildTutorSystemMessage(
  locale: AppLocale,
  context: string,
  selectedExcerpt?: string,
  hasSelectedImage?: boolean,
): string {
  const labels = TUTOR_CONTEXT[locale];
  const parts: string[] = [getTutorSystemPrompt(locale), TUTOR_MATH_RULES[locale]];

  if (context.trim()) {
    parts.push(`\n\n${labels.material}${context}`);
  }
  if (hasSelectedImage) {
    parts.push(`\n\n${labels.imageRegion}`);
  } else if (selectedExcerpt?.trim()) {
    parts.push(`\n\n${labels.excerpt}${selectedExcerpt}"""`);
  }

  return parts.join('');
}
