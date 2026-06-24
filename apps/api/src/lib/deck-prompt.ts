import type { AppLocale, DeckAccent, DeckAudience } from '@talim/types';

// Talim's audience is Uzbek teachers/students — Uzbek is the primary language and
// must read as a native Uzbek teacher wrote it (not machine-translated); Russian is
// the strong secondary; English is low priority.
function languageGuidance(locale: AppLocale): string {
  switch (locale) {
    case 'uz':
      return 'Write ALL text in natural, grammatically correct Uzbek (Latin script), exactly as a native Uzbek schoolteacher would write it — NOT machine-translated phrasing. Use standard Uzbek subject terminology. This is the platform\'s primary language, so prioritise Uzbek correctness and clarity.';
    case 'ru':
      return 'Write ALL text in natural, grammatically correct Russian appropriate for school students.';
    case 'en':
    default:
      return 'Write ALL text in clear, correct English.';
  }
}

const ACCENTS: DeckAccent[] = ['teal', 'indigo', 'violet', 'coral', 'amber', 'sky', 'emerald', 'fuchsia'];

/** Stable per-content accent so the same material always gets the same theme. */
export function pickAccent(seed: string): DeckAccent {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length] ?? 'teal';
}

/** ~1 slide per 350 source words, clamped, with a few extra (shorter) slides for kids. */
export function targetSlideCount(sourceWordCount: number, audience: DeckAudience): number {
  const base = Math.min(Math.max(Math.ceil(sourceWordCount / 350), 6), 22);
  return audience === 'kids' ? Math.min(base + 2, 24) : base;
}

export function estimatedMinutesFor(slideCount: number): number {
  return Math.max(1, Math.round(slideCount * 0.75));
}

export function getDeckSystemPrompt(locale: AppLocale, audience: DeckAudience): string {
  return `You are a master instructional designer who builds study slide decks from PROVIDED material only.

ABSOLUTE RULES:
- Use ONLY facts, numbers, dates, names, and quotes present in the CONTEXT. Never invent anything. If unsure, omit it.
- For "bigStat", "statTrio", and "chart", every value MUST appear in the source. Emit a "chart" ONLY when the source contains real numeric data.
- Output is SEMANTIC CONTENT ONLY. Never emit colors, hex, CSS, HTML, font sizes, or inline styles. The renderer owns all styling.
- NEVER produce slides about the system, the file, or the process: do not say the document "could not be read", is empty/unreadable, or ask the user to retry/upload again. Build slides ONLY from the material's subject matter. (Insufficient material is handled before you are called.)
- Return ONE JSON object matching the schema. No prose, no markdown code fences, no commentary.

SOURCE HANDLING:
- The CONTEXT may be a spoken lecture or video transcript — conversational, with filler, repetition, self-promotion, and speech-to-text errors. Do NOT quote it verbatim or turn raw spoken fragments into slides.
- DISTILL it into the underlying lesson: pull out the concepts, definitions, formulas, worked examples, steps, and data, and present them as clean, well-structured slides.
- IGNORE greetings, sign-offs, asides, repeated passages, and any subscribe / channel / "join our telegram" / self-promotion lines.
- Silently correct obvious transcription errors (garbled terms or numbers) when the intended meaning is clear from context — this is cleaning the SAME material, not inventing. Never add facts or numbers the source does not support.
- When the source works through a problem, show the problem statement and its solution steps (process / twoColumn / definition), not the speaker's chatter.

JSON SHAPE (follow EXACTLY):
- The deck object MUST include: "schemaVersion":"1", "title" (a real lesson title, NOT a filename), "subtitle", "audience", "accent", "language", "estimatedMinutes", "sourceContentId", and "slides" (an array).
- Each slide object's layout field MUST be named "layout" (NOT "type"), set to one of the layout names listed below.

PEDAGOGY (non-negotiable):
- One idea per slide. If a slide makes two points, split it.
- Titles are ASSERTION SENTENCES stating the takeaway (e.g. "Photosynthesis converts light into stored chemical energy"), NOT bare topics ("Photosynthesis").
- Each slide's body is the EVIDENCE or example proving the title — not a restatement of it.
- If a relationship exists, DRAW it: process/sequence/cause-effect/hierarchy -> "diagram" (mermaid); numeric trend/comparison -> "chart"; side-by-side -> "comparison"/"twoColumn"; one figure -> "bigStat". Use plain "concept" text only for purely verbal ideas.
- Long explanations go in "notes" (never rendered on the slide). On-slide text stays glanceable.
- Math/formulas use $...$ or $$...$$ only.

CONCISION: title <= ~14 words; body <= ~40 words; bullets 3-6 items at <= ~12 words each; comparison/process items short.

STRUCTURE & VARIETY:
- Open with exactly one "cover". End with one "recap" (3-5 takeaways).
- Include 1-2 "quickCheck" slides: roughly one after every ~4 content slides, and one before the recap.
- NARRATIVE ARC: hook -> context/why -> core ideas (chunked) -> worked example -> recap -> check.
- VARY LAYOUTS: at most 2 "bullets" slides in a row; use at least one of {bigStat, statTrio, quote, diagram, comparison, definition} every ~5 slides.

ICONS: only from this set — lightbulb, alert-triangle, check-circle, book-open, target, zap, trending-up, trending-down, beaker, calculator, globe, clock, star, flag, puzzle, rocket, brain, flame, leaf, scale.

LANGUAGE: ${languageGuidance(locale)}

AUDIENCE TONE — ${audience}:
${audienceTone(audience)}`;
}

function audienceTone(audience: DeckAudience): string {
  switch (audience) {
    case 'kids':
      return '- Short warm sentences (assertions <= ~10 words), one vivid concrete example per slide, at most one friendly emoji per slide, encouraging quickCheck phrasing, checks more frequent (every ~2-3 slides), titles often framed as questions ("Why does ice float?").';
    case 'tutors':
      return '- Precise terminology; put richer teaching detail in "notes" so a tutor can expand on each slide.';
    case 'students':
    default:
      return '- Clear, exam-focused, neutral tone.';
  }
}

export function buildDeckUserPrompt(params: {
  title: string;
  audience: DeckAudience;
  locale: AppLocale;
  targetSlides: number;
  contentId: string;
  accent: DeckAccent;
  context: string;
}): string {
  const { title, audience, locale, targetSlides, contentId, accent, context } = params;
  return `DECK META:
- title: ${title}
- audience: ${audience}
- language: ${locale}
- target slide count N: ${targetSlides}
- sourceContentId: ${contentId}
- accent: ${accent}

LAYOUT MENU (pick the layout that fits each idea's shape):
- cover: deck title + subtitle/kicker. Exactly one, first.
- section: divider for a new theme; optional 2-char index.
- concept: assertion title + short evidence text (+optional icon). The workhorse for verbal ideas.
- bullets: 3-6 parallel items, each with an optional icon.
- twoColumn: text vs example / two related blocks (markdown each).
- bigStat: one huge memorable number + label + context.
- statTrio: 2-3 related numbers side by side.
- quote: a primary-source line or principle.
- definition: a term + definition + optional example/pronunciation.
- comparison: prosCons (good vs bad) or vsTable (A vs B); 2-5 items each side.
- process: 2-6 sequential steps.
- diagram: a mermaid diagram for a real process/relationship/hierarchy.
- chart: a bar/line/area chart — ONLY with real numbers from the source.
- callout: tip | warning | note | key | example highlight box.
- recap: 3-5 key takeaways. Near the end.
- quickCheck: mcq | trueFalse | open comprehension check; mark the correct option(s) and give answerExplanation.

FIELD EXAMPLES (use these EXACT field names; this is the shape, not the content):
{"id":"s1","layout":"cover","title":"Lesson title","subtitle":"...","kicker":"..."}
{"id":"s2","layout":"concept","title":"An assertion sentence","body":"Short evidence.","icon":"lightbulb"}
{"id":"s3","layout":"bullets","title":"...","bullets":[{"text":"Point one","icon":"target"},{"text":"Point two"}]}
{"id":"s4","layout":"statTrio","title":"...","stats":[{"value":"18","label":"..."},{"value":"30","label":"..."}]}
{"id":"s5","layout":"bigStat","value":"70%","label":"...","context":"..."}
{"id":"s6","layout":"process","title":"...","steps":[{"title":"Step 1","detail":"..."},{"title":"Step 2"}]}
{"id":"s7","layout":"quickCheck","question":"What is X?","kind":"mcq","options":[{"text":"A","correct":false},{"text":"B","correct":true}],"answerExplanation":"..."}
{"id":"s8","layout":"recap","title":"Key takeaways","points":["Takeaway one","Takeaway two"]}
(bullets use "bullets" with {text}; statTrio uses "stats"; recap uses "points"; quickCheck uses "question"+"kind"+"options" as {text,correct} — never bare strings or an "items" array.)

=== CONTEXT START ===
${context}
=== CONTEXT END ===

Generate the deck now. Return ONLY the JSON object matching the schema, with "schemaVersion":"1", "accent":"${accent}", "language":"${locale}", "audience":"${audience}", "sourceContentId":"${contentId}", and about ${targetSlides} slides. Give every slide a unique "id". Add "sourceRefs" to each content slide.`;
}
