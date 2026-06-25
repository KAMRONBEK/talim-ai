import type { AppLocale } from '@talim/types';
import { z } from 'zod';
import { generateJsonCompletion } from '../services/ai.service.js';
import { scriptVariants } from './uzbek-translit.js';

export type TutorScopeRoute =
  | 'direct'
  | 'related_extension'
  | 'unrelated'
  | 'needs_clarification';

export interface TutorScopeDecision {
  route: TutorScopeRoute;
  reason: string;
  scopeNote?: string;
}

interface ClassifyTutorScopeInput {
  locale: AppLocale;
  contentTitle: string;
  message: string;
  context: string;
  selectedExcerpt?: string;
  hasSelectedImage?: boolean;
}

const decisionSchema = z.object({
  route: z.enum(['direct', 'related_extension', 'unrelated', 'needs_clarification']),
  reason: z.string().min(1).max(300),
  scopeNote: z.string().max(300).optional(),
});

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'angle',
  'ask',
  'being',
  'chapter',
  'current',
  'does',
  'draw',
  'explain',
  'give',
  'have',
  'into',
  'material',
  'over',
  'please',
  'question',
  'simulate',
  'simple',
  'tell',
  'that',
  'them',
  'there',
  'this',
  'time',
  'what',
  'with',
  'would',
  'about',
  'haqida',
  'qanday',
  'uchun',
  'bilan',
  'этот',
  'если',
  'когда',
]);

const OUT_OF_SCOPE_PREFIX: Record<AppLocale, string> = {
  uz: "Bu savol o'rganayotgan materialingiz doirasidan tashqarida.",
  en: 'This question is outside the scope of your material.',
  ru: 'Этот вопрос выходит за рамки вашего материала.',
};

const OUT_OF_SCOPE_FOLLOWUP: Record<AppLocale, string> = {
  uz: "Hozirgi materialga oid savol bersangiz, yordam beraman.",
  en: 'If you ask about the current material, I can help.',
  ru: 'Если зададите вопрос по текущему материалу, я помогу.',
};

const CLARIFICATION_TEXT: Record<AppLocale, string> = {
  uz: "Savolingizni biroz aniqlashtirib bera olasizmi? Hozirgi materialdagi qaysi qism yoki tushuncha haqida so'rayotganingizni yozing.",
  en: 'Could you clarify your question a bit? Please mention which part or concept from the current material you mean.',
  ru: 'Можете немного уточнить вопрос? Напишите, о какой части или понятии текущего материала идет речь.',
};

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-zа-яё0-9']+/gi) ?? [])
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

function overlapCount(a: string[], b: string[]): number {
  const bSet = new Set(b);
  return a.filter((token) => bSet.has(token)).length;
}

function guessScopeHeuristically(input: ClassifyTutorScopeInput): TutorScopeDecision {
  // Include both script forms of the query so a Latin question ("shin") overlaps
  // Cyrillic material ("шин") — otherwise cross-script questions look "unrelated".
  const queryTokens = tokenize(scriptVariants(input.message).join(' '));
  if (queryTokens.length === 0) {
    return {
      route: 'needs_clarification',
      reason: 'The query is too short or vague to classify.',
    };
  }

  const titleTokens = tokenize(scriptVariants(input.contentTitle).join(' '));
  const contextTokens = tokenize(input.context).slice(0, 400);
  const excerptTokens = tokenize(input.selectedExcerpt ?? '');
  const materialTokens = [...titleTokens, ...contextTokens, ...excerptTokens];
  const overlap = overlapCount(queryTokens, materialTokens);
  const titleOverlap = overlapCount(queryTokens, titleTokens);

  if (titleOverlap > 0) {
    const route = /compare|difference|advanced|double|coupled|nonlinear|chaotic/i.test(input.message)
      ? 'related_extension'
      : 'direct';
    return {
      route,
      reason: 'The query shares core title terms with the current material.',
      scopeNote:
        route === 'related_extension'
          ? 'This request is a related extension of the current chapter. Briefly connect it to the chapter before answering.'
          : 'This request is directly in scope for the current chapter.',
    };
  }

  if (overlap >= 2 || (overlap >= 1 && input.hasSelectedImage)) {
    return {
      route: 'direct',
      reason: 'The query overlaps with retrieved material context.',
      scopeNote: 'This request is directly in scope for the current chapter.',
    };
  }

  return {
    route: 'unrelated',
    reason: 'The query has no meaningful overlap with the current title or retrieved context.',
  };
}

export async function classifyTutorScope(
  input: ClassifyTutorScopeInput,
): Promise<TutorScopeDecision> {
  const fallback = guessScopeHeuristically(input);

  try {
    const result = await generateJsonCompletion<unknown>(
      [
        {
          role: 'system',
          content: `You classify student questions for a study-material tutor.

Return JSON only:
{
  "route": "direct" | "related_extension" | "unrelated" | "needs_clarification",
  "reason": "short reason",
  "scopeNote": "optional short note for the tutor"
}

Definitions:
- direct: answered by the current material or clearly about the same exact concept.
- related_extension: a natural extension of the topic, even if the chapter focuses on a simpler or narrower version. Example: double pendulum while studying simple pendulums.
- unrelated: clearly outside the material topic.
- needs_clarification: too vague or missing the key reference needed to answer.

Important:
- Prefer related_extension over unrelated when the core concept/entity matches.
- The material and the question may be written in DIFFERENT scripts (Uzbek Latin vs
  Cyrillic, e.g. "shin" = "шин", "nuqta" = "нуқта"). Transliterate mentally and treat
  them as the same language — never mark a question "unrelated" just because the
  retrieved context is in another script.
- Use the retrieved context and title, not previous assistant refusals.
- Keep reason concise.
- scopeNote should be present for direct or related_extension.`,
        },
        {
          role: 'user',
          content: `Locale: ${input.locale}
Content title: ${input.contentTitle}
Student message: ${input.message}
Selected excerpt: ${input.selectedExcerpt?.trim() || '(none)'}
Has selected image: ${input.hasSelectedImage ? 'yes' : 'no'}

Retrieved context:
${input.context || '(none)'}`,
        },
      ],
      { temperature: 0 },
    );

    return decisionSchema.parse(result);
  } catch {
    return fallback;
  }
}

export function getOutOfScopeResponse(locale: AppLocale): string {
  return `${OUT_OF_SCOPE_PREFIX[locale]} ${OUT_OF_SCOPE_FOLLOWUP[locale]}`;
}

export function getClarificationResponse(locale: AppLocale): string {
  return CLARIFICATION_TEXT[locale];
}

export function isTutorScopeRefusal(locale: AppLocale, text: string): boolean {
  return text.trim().toLowerCase().startsWith(OUT_OF_SCOPE_PREFIX[locale].toLowerCase());
}
