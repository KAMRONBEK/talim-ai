import type { AppLocale } from '@talim/types';
import { z } from 'zod';
import { generateJsonCompletion } from '../services/ai.service.js';
import { scriptVariants } from './uzbek-translit.js';

type TutorScopeRoute = 'direct' | 'related_extension' | 'unrelated' | 'needs_clarification';

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
  /**
   * Recent prior turns (oldest→newest), already stripped of the tutor's own
   * refusal/clarification messages. Lets the classifier resolve follow-ups
   * ("explain more", "draw the last one") that are meaningless in isolation but
   * clearly in-scope given the conversation. Without this, every anaphoric
   * follow-up gets misrouted to `needs_clarification`.
   */
  recentTurns?: { role: 'user' | 'assistant'; text: string }[];
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
  uz: 'Hozirgi materialga oid savol bersangiz, yordam beraman.',
  en: 'If you ask about the current material, I can help.',
  ru: 'Если зададите вопрос по текущему материалу, я помогу.',
};

const CLARIFICATION_TEXT: Record<AppLocale, string> = {
  uz: "Savolingizni biroz aniqlashtirib bera olasizmi? Hozirgi materialdagi qaysi qism yoki tushuncha haqida so'rayotganingizni yozing.",
  en: 'Could you clarify your question a bit? Please mention which part or concept from the current material you mean.',
  ru: 'Можете немного уточнить вопрос? Напишите, о какой части или понятии текущего материала идет речь.',
};

const FOLLOWUP_NOTE =
  'This is a follow-up to the ongoing in-scope conversation. Use the conversation history to resolve what the student is referring to, then answer it.';

// Continuation cues across uz/en/ru that mark a message as a follow-up to the prior
// turn ("explain more", "draw it", "the last problem") rather than a fresh question.
// Matched against the raw message because the strongest cues (it/that/shu) are dropped
// by tokenize()'s length/stop-word filter.
const FOLLOWUP_CUES =
  /(\bmore\b|\bagain\b|\bexplain\b|\bdraw\b|\bshow\b|\bvisual|\bcontinue\b|\bprevious\b|\blast\b|\bthis\b|\bthat\b|\bit\b|ko'?proq|yana|boshqa|davom|chizib|chiz\b|rasm|tasvir|tushuntir|oxirgi|yuqorida|shuni|buni|uni\b|подробн|ещё|еще|нарису|преды|объясн|покажи|это\b)/i;

function looksLikeFollowUp(message: string): boolean {
  const tokens = tokenize(scriptVariants(message).join(' '));
  return tokens.length <= 5 || FOLLOWUP_CUES.test(message);
}

function formatRecentTurns(turns: ClassifyTutorScopeInput['recentTurns']): string {
  if (!turns || turns.length === 0) return '(none)';
  return turns
    .slice(-6)
    .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text.slice(0, 500)}`)
    .join('\n');
}

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
  const hasPriorAnswer = (input.recentTurns ?? []).some((t) => t.role === 'assistant');

  if (queryTokens.length === 0) {
    // A bare/too-short message inside an ongoing conversation ("yana?", "more",
    // "chizib ber") is a follow-up — answer it using the conversation rather than
    // demanding clarification it already answered.
    if (hasPriorAnswer) {
      return {
        route: 'direct',
        reason: 'Short follow-up in an ongoing in-scope conversation.',
        scopeNote: FOLLOWUP_NOTE,
      };
    }
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
    const route = /compare|difference|advanced|double|coupled|nonlinear|chaotic/i.test(
      input.message,
    )
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

  // No title/context overlap. In a fresh conversation that reads as "unrelated", but a
  // follow-up to an in-scope answer ("explain more", "draw the last one") legitimately
  // has no standalone material overlap of its own — keep answering it, using the history.
  if (hasPriorAnswer && looksLikeFollowUp(input.message)) {
    return {
      route: 'direct',
      reason: 'Follow-up to an in-scope conversation with low standalone overlap.',
      scopeNote: FOLLOWUP_NOTE,
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
- The student message is often a FOLLOW-UP to the recent conversation (e.g. "explain
  more", "draw it", "the previous problem", "ko'proq tushuntir", "oxirgi masalani
  visual tushuntir"). When it is, classify it RELATIVE TO that conversation: if the
  recent exchange was in-scope, the follow-up is "direct" (or "related_extension").
  Only use "needs_clarification" when there is genuinely no way to tell what is meant
  EVEN GIVEN the conversation — never demand clarification for a question the prior
  turns already make clear.
- The material and the question may be written in DIFFERENT scripts (Uzbek Latin vs
  Cyrillic, e.g. "shin" = "шин", "nuqta" = "нуқта"). Transliterate mentally and treat
  them as the same language — never mark a question "unrelated" just because the
  retrieved context is in another script.
- Use the retrieved context, title, and recent conversation; ignore the tutor's own
  previous refusals.
- Keep reason concise.
- scopeNote should be present for direct or related_extension.`,
        },
        {
          role: 'user',
          content: `Locale: ${input.locale}
Content title: ${input.contentTitle}

Recent conversation (oldest to newest):
${formatRecentTurns(input.recentTurns)}

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

/** True if `text` is one of the canned "please clarify" replies (any locale). These are
 *  not real content turns, so they're excluded from the history fed to the classifier. */
export function isTutorClarification(text: string): boolean {
  const trimmed = text.trim();
  return Object.values(CLARIFICATION_TEXT).some((c) => trimmed === c.trim());
}
