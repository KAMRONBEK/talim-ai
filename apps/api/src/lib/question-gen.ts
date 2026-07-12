import type { QuestionType } from '@prisma/client';
import type { AppLocale, QuestionDepth } from '@talim/types';
import { generateJsonCompletion } from '../services/ai.service.js';
import type { GeneratedQuestion } from '../services/assessment/shared.js';
import {
  getQuestionGenSystemPrompt,
  buildQuestionGenPrompt,
  type GeneratableQuestionType,
} from './question-gen-prompt.js';
import {
  postprocessGeneratedQuestions,
  overgenerateCount,
  type ProcessedQuestion,
  type SkipReason,
} from './question-postprocess.js';

/**
 * Shared generate→filter→fill loop for BOTH question pipelines. A single pass can fall far
 * short of the requested count when the quality filters bite (observed live: 15 requested,
 * 23 generated, 18 rejected, 5 delivered) — so when the first pass leaves a shortfall, one
 * fill pass re-prompts for the missing items with the kept stems listed as forbidden
 * repeats. Rejection reasons are aggregated for the caller to log.
 */

type GenerateOptions = NonNullable<Parameters<typeof generateJsonCompletion>[1]>;

export interface QuestionSetRequest {
  locale: AppLocale;
  title: string;
  topic?: string | null;
  context: string | null;
  /** Target number of DELIVERED questions (each pass overgenerates internally). */
  count: number;
  types: GeneratableQuestionType[] | null;
  depth: QuestionDepth;
  normalizeType: (type: string | undefined) => QuestionType;
  usage?: GenerateOptions['usage'];
  temperature?: number;
}

export interface QuestionSetResult {
  questions: ProcessedQuestion[];
  skipped: number;
  breakdown: Partial<Record<SkipReason, number>>;
  /** How many model calls were made (1 = first pass sufficed). */
  passes: number;
}

const MAX_GENERATION_PASSES = 2;

export async function generateQuestionSet(req: QuestionSetRequest): Promise<QuestionSetResult> {
  const seenStems = new Set<string>();
  const questions: ProcessedQuestion[] = [];
  let skipped = 0;
  const breakdown: Partial<Record<SkipReason, number>> = {};
  let passes = 0;

  // A fill pass re-sends the full context (the dominant token cost) and roughly doubles
  // latency — not worth it for a marginal shortfall (19/20 delivered), only for a real one.
  const tolerableShortfall = Math.max(1, Math.floor(req.count * 0.1));

  for (let pass = 1; pass <= MAX_GENERATION_PASSES && questions.length < req.count; pass++) {
    const need = req.count - questions.length;
    if (pass > 1 && need <= tolerableShortfall) break;
    passes = pass;
    // The fill pass overgenerates harder — the model already spent its most obvious items.
    const ask = pass === 1 ? overgenerateCount(need) : Math.min(30, need * 2 + 2);

    const result = await generateJsonCompletion<{ questions: GeneratedQuestion[] }>(
      [
        { role: 'system', content: getQuestionGenSystemPrompt(req.locale) },
        {
          role: 'user',
          content: buildQuestionGenPrompt(req.locale, {
            title: req.title,
            topic: req.topic,
            context: req.context,
            count: ask,
            types: req.types,
            depth: req.depth,
            avoidStems: questions.map((q) => q.prompt),
          }),
        },
      ],
      {
        ...(req.usage ? { usage: req.usage } : {}),
        ...(req.temperature != null ? { temperature: req.temperature } : {}),
      },
    );

    const generated = result.questions ?? [];
    if (generated.length === 0) break;

    // seenStems is shared across passes — the postprocess dedupe adds every kept stem to
    // it, so a fill-pass repeat of a pass-1 question dies as duplicateStem.
    const post = postprocessGeneratedQuestions({
      generated,
      context: req.context ?? '',
      count: need,
      allowedTypes: req.types as QuestionType[] | null,
      normalizeType: req.normalizeType,
      seenStems,
    });
    questions.push(...post.questions);
    skipped += post.skipped;
    for (const [reason, n] of Object.entries(post.breakdown)) {
      breakdown[reason as SkipReason] = (breakdown[reason as SkipReason] ?? 0) + (n ?? 0);
    }
  }

  return { questions, skipped, breakdown, passes };
}
