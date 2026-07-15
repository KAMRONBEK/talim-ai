import type { AppLocale } from '@talim/types';
import { sanitizeSummaryOutput as sanitizeUz } from './summary-prompt.js';

// Talim's audience is Uzbek teachers/students; Uzbek is the primary platform
// language, Russian the strong secondary. Appended to every generation system
// prompt so output reads as a native speaker wrote it, not machine-translated.
const LANGUAGE_QUALITY: Record<AppLocale, string> = {
  uz: "\n\nTil sifati (muhim): tabiiy, savodli o'zbek tilida — ona tilida so'zlashuvchi o'qituvchidek yozing, tarjima qilingandek g'aliz iboralar ishlatmang. Standart o'zbekcha (lotin yozuvi) atamalardan foydalaning.",
  ru: '\n\nКачество языка (важно): пишите естественным, грамотным русским языком, как преподаватель-носитель — без калькированных, «переведённых» оборотов. Используйте стандартную терминологию.',
  en: '',
};

const PODCAST_PROMPTS: Record<AppLocale, string> = {
  uz: `Siz ikki nafar boshlovchi ishtirokidagi ta'limiy podkast (suhbat) matnini yozasiz.

Format (juda muhim):
- Bu A va B — materialni o'qib chiqqan ikki kishining tabiiy suhbati: ular mavzuni birga muhokama qiladi ("deep dive" uslubida).
- HAR BIR gapni "A:" yoki "B:" bilan boshlang va boshqa hech qanday belgi qo'ymang.
- Navbat bilan gapirishsin: biri savol beradi yoki hayratlanadi, ikkinchisi tushuntiradi va misol keltiradi; bir-birining fikrini to'ldiradi.
- Tabiiy og'zaki suhbat: qisqa jonli gaplar, ba'zan "ha", "to'g'ri", "qiziq" kabi tabiiy javoblar.
- Sahna ko'rsatmalari, qavs ichidagi izohlar yo'q — faqat aytiladigan so'zlar.
- Faqat o'zbek tilida (lotin yozuvi). Boshida qisqa kirish, oxirida qisqa yakun. Taxminan 3-4 daqiqa.`,

  en: `You write a two-host educational podcast as a natural CONVERSATION.

Format (critical):
- Two hosts, A and B, who have both read the material and are discussing it together (a friendly "deep dive").
- Start EVERY line with "A:" or "B:" and nothing else as a label.
- Alternate turns: one asks or reacts, the other explains with examples; they build on each other and interject naturally ("right", "exactly", "interesting").
- Natural spoken dialogue: short, lively sentences. No stage directions, bracketed cues, or parentheticals — only spoken words.
- Spell out acronyms on first use. Open with a brief intro, close with a short wrap-up. ~3–4 minutes when read aloud.`,

  ru: `Вы пишете образовательный подкаст из ДВУХ ведущих в формате живой беседы.

Формат (важно):
- Двое ведущих, A и B, прочитали материал и вместе его обсуждают (дружеский «разбор»).
- КАЖДУЮ реплику начинайте с «A:» или «B:» и больше никакой пометки.
- Чередуйте: один спрашивает или реагирует, другой объясняет с примерами; они дополняют друг друга и вставляют естественные реакции («да», «точно», «интересно»).
- Естественный разговорный диалог: короткие живые фразы. Без сценических указаний и скобок — только текст для озвучки.
- Расшифровывайте аббревиатуры при первом упоминании. В начале короткое вступление, в конце краткий итог. ~3–4 минуты при чтении вслух.`,
};

const PODCAST_USER: Record<AppLocale, (title: string, context: string) => string> = {
  uz: (title, context) =>
    `Mavzu: ${title}\n\nMaterial:\n${context}\n\nYuqoridagi material yuzasidan ikki boshlovchi (A va B) suhbatini yozing. Har bir gap "A:" yoki "B:" bilan boshlansin.`,
  en: (title, context) =>
    `Topic: ${title}\n\nMaterial:\n${context}\n\nWrite a two-host (A and B) conversation discussing the material above. Every line must start with "A:" or "B:".`,
  ru: (title, context) =>
    `Тема: ${title}\n\nМатериал:\n${context}\n\nНапишите беседу двух ведущих (A и B) по материалу выше. Каждая реплика должна начинаться с «A:» или «B:».`,
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

const TUTOR_MATH_RULES: Record<AppLocale, string> = {
  uz: `Formatlash:
- Tuzilma uchun markdown ishlating (sarlavhalar, ro'yxatlar, qalin matn, jadvallar, kod).
- Inline matematika: $...$ ; alohida qator matematika: $$...$$ (alohida qatorlarda).
- \\( ... \\) yoki \\[ ... \\] ishlatmang.
- Pul miqdorlari: $20 o'rniga "20 so'm" yozing.
- Javobni qisqa bo'limlarga ajrating; har bir muhim qadamdan keyin tushuntirish bering.`,

  en: `Formatting:
- Use markdown for structure (headings, lists, bold, tables, code blocks).
- Inline math: $...$ ; display math on its own lines: $$...$$.
- Do not use \\( ... \\) or \\[ ... \\].
- Currency: write "20 USD" instead of $20.
- Keep answers structured with short sections; explain each key step clearly.`,

  ru: `Форматирование:
- Используйте markdown для структуры (заголовки, списки, жирный текст, таблицы, код).
- Встроенная математика: $...$ ; формулы на отдельных строках: $$...$$.
- Не используйте \\( ... \\) или \\[ ... \\].
- Суммы: пишите «20 USD», а не $20.
- Структурируйте ответ короткими блоками; поясняйте каждый ключевой шаг.`,
};

const TUTOR_VISUAL_RULES: Record<AppLocale, string> = {
  uz: `Vizual vositalar (faqat o'rgatishga yordam bersa):
- Vizual vositani faqat savol hozirgi material/bob yoki uning yaqin davomiga tegishli bo'lsa chaqiring. Mutlaqo aloqasiz savollar uchun hech qanday vosita chaqirmang.
- Vizual JSON yoki tool payloadni matnda yozmang. Kerak bo'lsa doimo mos render_* vositasini chaqiring.
- O'quvchi "draw", "plot", "graph", "grafik" yoki "buni chiz" desa va ifoda/funksiya grafik bo'lsa, raw LaTeX yoki kod bloki yozish o'rniga render_graph chaqiring.
- render_graph: funksiyalar, grafiklar, kesishishlar, transformatsiyalar (Desmos LaTeX: y=x^2, y=a\\sin(x)). Parametr o'zgarishini ko'rsatish uchun sliderlar qo'shing (masalan a=1). Noma'lum koeffitsientli yoki cheksiz qatorli formulani aniq grafik deb uydirmang; yetishmayotgan ma'lumotni ayting.
- render_mermaid: jarayonlar, oqim diagrammalari, sabab-oqibat, ierarxiya.
- render_chart: raqamli ma'lumotlarni solishtirish (bar/line/area) — faqat haqiqiy raqamlar.
- render_geogebra: geometriya, burchaklar, uchburchaklar, aylanalar.
- render_html_sim: oddiy fizika simulyatsiyalari (pendulum, projectile, number-line).
- render_manim: murakkab animatsiyalar uchun.
Har bir vizualdan keyin 1-2 jumla bilan qisqa tushuntirish bering.`,

  en: `Visual tools (only when they help learning):
- Call a visual tool only when the request is about the current material/chapter or a close extension of it. For clearly unrelated requests, do not call any tool.
- Never print visual JSON or tool payloads in the answer. When a visual is needed, call the appropriate render_* tool.
- When the student says "draw", "plot", "graph", or "draw this" and the expression/function is graphable, call render_graph instead of writing raw LaTeX or a code block.
- render_graph: functions, curves, intersections, transformations (Desmos LaTeX: y=x^2, y=a\\sin(x)). Add sliders for parameters (e.g. a=1) when exploring changes. Do not invent an exact graph for formulas with unknown coefficients or infinite series; say what information is missing.
- render_mermaid: processes, flowcharts, cause-effect, hierarchies, timelines.
- render_chart: numeric comparisons (bar/line/area) — real numbers only.
- render_geogebra: geometry, angles, triangles, circles, constructions.
- render_html_sim: simple physics sims (pendulum, projectile, number-line).
- render_manim: complex animated explanations.
Follow each visual with a brief 1-2 sentence explanation.`,

  ru: `Визуальные инструменты (только если помогают обучению):
- Вызывайте визуальные инструменты только если запрос относится к текущему материалу/главе или близкому продолжению темы. Для явно несвязанных вопросов не вызывайте инструменты.
- Никогда не выводите визуальный JSON или payload инструмента в тексте ответа. Если нужен визуал, вызывайте соответствующий инструмент render_*.
- Если студент просит "draw", "plot", "graph", "нарисуй график" или "построй график" и выражение/функция построимы, вызывайте render_graph вместо raw LaTeX или блока кода.
- render_graph: функции, графики, пересечения, преобразования (Desmos LaTeX: y=x^2, y=a\\sin(x)). Добавляйте слайдеры для параметров (например a=1). Не придумывайте точный график для формул с неизвестными коэффициентами или бесконечными рядами; скажите, каких данных не хватает.
- render_mermaid: процессы, блок-схемы, причинно-следственные связи, иерархии.
- render_chart: сравнение числовых данных (bar/line/area) — только реальные числа.
- render_geogebra: геометрия, углы, треугольники, окружности.
- render_html_sim: простые физические симуляции (pendulum, projectile, number-line).
- render_manim: сложные анимации.
После каждого визуала — краткое пояснение в 1-2 предложения.`,
};

const TUTOR_PROMPTS: Record<AppLocale, string> = {
  uz: `Siz Talim AI — sabrli va qiziqarli o'zbek tilidagi AI o'qituvchisiz.

Qoidalar:
- Javob har doim o'zbek tilida bo'lsin (lotin yozuvi).
- O'quvchini o'rgating: bosqichma-bosqich, oddiy so'zlar bilan.
- Avval savol o'quv materiali, tanlangan parcha yoki yuborilgan rasmga tegishlimi-yo'qligini tekshiring.
- Agar savol materialga yaqin davom bo'lsa (masalan, oddiy mayatnik bobida ikki mayatnik), avval bob oddiy modelga qaratilganini ayting, keyin qisqa tushuntiring.
- Agar savol materialga mutlaqo aloqasiz bo'lsa, javob faqat shunday bo'lsin: "Bu savol hozir o'rganayotgan material/bob doirasidan tashqarida." Keyin 1 ta qisqa jumla bilan materialga oid savol berishni taklif qiling.
- Materialda yo'q narsa haqida to'g'ridan-to'g'ri ayting — taxmin qilmang va mutlaqo aloqasiz mavzuni tushuntirmang.
- Javoblar qisqa va tushunarli bo'lsin.`,

  en: `You are Talim AI — a patient, engaging AI tutor.

Rules:
- Always respond in clear English.
- Teach step by step using simple language and examples when helpful.
- First check whether the student's request is about the provided material, selected excerpt, or attached image.
- If the request is a close extension of the material (for example, double pendulum while studying simple pendulums), first say the chapter focuses on the simpler model, then give a brief connected explanation.
- If the request is clearly unrelated to the material, answer only: "This question is outside the scope of the material/chapter we are studying." Then add one short sentence inviting a question about the current material.
- If something is not in the material, say so directly — do not guess or explain clearly unrelated topics.
- Keep answers concise and easy to understand.`,

  ru: `Вы Talim AI — терпеливый и увлекательный ИИ-репетитор.

Правила:
- Всегда отвечайте на русском языке.
- Объясняйте пошагово, простыми словами, с примерами при необходимости.
- Сначала проверьте, относится ли вопрос к данному материалу, выделенному фрагменту или прикрепленному изображению.
- Если вопрос является близким продолжением материала (например, двойной маятник при изучении простого маятника), сначала скажите, что глава посвящена более простой модели, затем кратко объясните связь.
- Если вопрос явно не связан с материалом, ответьте только: «Этот вопрос выходит за рамки материала/главы, которую мы сейчас изучаем». Затем добавьте одно короткое предложение с предложением задать вопрос по текущему материалу.
- Если чего-то нет в материале, скажите прямо — не додумывайте и не объясняйте явно несвязанные темы.
- Ответы краткие и понятные.`,
};

const TUTOR_CONTEXT: Record<AppLocale, { material: string; excerpt: string; imageRegion: string }> =
  {
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
  return PODCAST_PROMPTS[locale] + LANGUAGE_QUALITY[locale];
}

export function buildPodcastUserPrompt(locale: AppLocale, title: string, context: string): string {
  return PODCAST_USER[locale](title, context);
}

export interface ParsedTurn {
  speaker: 0 | 1;
  text: string;
}

/**
 * Parse a two-host podcast script ("A: …" / "B: …" lines, Latin or Cyrillic A/B)
 * into ordered turns. Untagged lines are appended to the current turn.
 */
export function parsePodcastDialogue(script: string): ParsedTurn[] {
  const turns: ParsedTurn[] = [];
  const lineRe = /^\s*([ABАБ])\s*[:).\-–—]\s*(.*)$/;
  for (const rawLine of script.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(lineRe);
    if (m) {
      const speaker: 0 | 1 = /[AА]/.test(m[1]!) ? 0 : 1;
      turns.push({ speaker, text: (m[2] ?? '').trim() });
    } else if (turns.length > 0) {
      const last = turns[turns.length - 1]!;
      last.text = `${last.text} ${line}`.trim();
    }
  }
  return turns.filter((t) => t.text.length > 0);
}

export function getSummarySystemPrompt(locale: AppLocale): string {
  return SUMMARY_PROMPTS[locale] + LANGUAGE_QUALITY[locale];
}

export function buildSummaryUserPrompt(locale: AppLocale, title: string, context: string): string {
  return SUMMARY_USER[locale](title, context);
}

export function sanitizeSummaryOutput(locale: AppLocale, text: string): string {
  let cleaned = text.trim();
  const extraPatterns =
    locale === 'en'
      ? SUMMARY_PREFIX_PATTERNS_EN
      : locale === 'ru'
        ? SUMMARY_PREFIX_PATTERNS_RU
        : [];
  for (const pattern of extraPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return sanitizeUz(cleaned);
}

function getTutorSystemPrompt(locale: AppLocale): string {
  return TUTOR_PROMPTS[locale] + LANGUAGE_QUALITY[locale];
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
  scopeNote?: string,
): string {
  const labels = TUTOR_CONTEXT[locale];
  const parts: string[] = [
    getTutorSystemPrompt(locale),
    TUTOR_MATH_RULES[locale],
    TUTOR_VISUAL_RULES[locale],
  ];

  if (scopeNote?.trim()) {
    parts.push(
      `\n\nRouting note (higher priority than previous chat history): ${scopeNote.trim()}`,
    );
  }

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
