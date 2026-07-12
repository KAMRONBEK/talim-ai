import { Prisma, type QuizKind, type QuestionType } from '@prisma/client';
import { parseAppLocale, type QuestionDepth } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from '../services/ai.service.js';
import { searchSimilarChunks, buildRagContext } from '../services/rag.service.js';
import { quizQueue, type GenerateQuizJobData } from '../services/queue.service.js';
import { jobEvents } from '../services/events/jobEvents.service.js';
import { getQuestionCount } from '../lib/quiz-prompt.js';
import { type QuestionStyle } from '../lib/assessment-prompt.js';
import {
  getQuestionGenSystemPrompt,
  buildQuestionGenPrompt,
  normalizePracticeQuestionType,
  typesFromStyle,
  GENERATABLE_TYPES,
  type GeneratableQuestionType,
} from '../lib/question-gen-prompt.js';
import {
  postprocessGeneratedQuestions,
  overgenerateCount,
} from '../lib/question-postprocess.js';
import { type GeneratedQuestion } from '../services/assessment/shared.js';

interface ContextChunk {
  text: string;
  chunkIndex: number;
}

/**
 * Below this many characters of section text there is nothing to ground questions in —
 * the model pads from its own knowledge and the sourceQuote firewall then rejects every
 * item (observed live: a heading-only 42-char section failed 9/9). Such sections widen
 * their context to the whole material instead.
 */
const MIN_SECTION_CONTEXT_CHARS = 500;

async function getSectionChunks(
  contentId: string,
  sectionId: string,
): Promise<{ sectionTitle: string; chunks: ContextChunk[] }> {
  const section = await prisma.contentSection.findFirst({
    where: { id: sectionId, contentId },
  });
  if (!section) throw new Error(`Section ${sectionId} not found`);

  const chunks = await prisma.chunk.findMany({
    where: {
      contentId,
      chunkIndex: { gte: section.startChunk, lte: section.endChunk },
    },
    orderBy: { chunkIndex: 'asc' },
    take: 15,
  });
  return {
    sectionTitle: section.title,
    chunks: chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex })),
  };
}

/** Loose containment normalization shared with the postprocess quote check. */
function containmentNormalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attribute a question to the section its sourceQuote came from, so answers on a
 * full-content quiz still update per-section mastery. Resolution: quote → containing
 * chunk → section whose [startChunk, endChunk] range covers it.
 */
function resolveSourceSection(
  sourceQuote: string | null,
  chunks: ContextChunk[],
  sections: { id: string; startChunk: number; endChunk: number }[],
): string | null {
  if (!sourceQuote || sections.length === 0) return null;
  const quote = containmentNormalize(sourceQuote);
  if (quote.length < 15) return null;
  const hit = chunks.find((c) => containmentNormalize(c.text).includes(quote));
  if (!hit) return null;
  const section = sections.find(
    (s) => hit.chunkIndex >= s.startChunk && hit.chunkIndex <= s.endChunk,
  );
  return section?.id ?? null;
}

/** Resolve the requested type set: explicit types win; else derive from the legacy style. */
function resolveRequestedTypes(
  jobTypes: string[] | undefined,
  quizTypes: unknown,
  style: QuestionStyle,
): GeneratableQuestionType[] | null {
  const raw = jobTypes ?? (Array.isArray(quizTypes) ? (quizTypes as string[]) : null);
  if (raw && raw.length > 0) {
    const valid = raw.filter((t): t is GeneratableQuestionType =>
      (GENERATABLE_TYPES as string[]).includes(t),
    );
    if (valid.length > 0) return valid;
  }
  return typesFromStyle(style);
}

export function registerGenerateQuizJob(): void {
  quizQueue.process(async (job) => {
    const {
      contentId,
      quizId,
      sectionId,
      kind,
      style: jobStyle,
      count: jobCount,
      types: jobTypes,
      depth: jobDepth,
      locale: jobLocale,
    } = job.data as GenerateQuizJobData;

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    const locale = parseAppLocale(jobLocale ?? quiz?.locale);

    const quizKind: QuizKind = kind ?? 'FULL';
    const style: QuestionStyle = jobStyle ?? (quiz?.style as QuestionStyle) ?? 'mixed';
    const count = jobCount ?? quiz?.count ?? getQuestionCount(quizKind);
    const depth: QuestionDepth = jobDepth ?? ((quiz?.depth as QuestionDepth) ?? 'mixed');
    const requestedTypes = resolveRequestedTypes(jobTypes, quiz?.types, style);

    let chunks: ContextChunk[];
    let topicTitle = content.title;
    if (sectionId) {
      const sectionCtx = await getSectionChunks(contentId, sectionId);
      chunks = sectionCtx.chunks;
      const sectionChars = chunks.reduce((sum, c) => sum + c.text.length, 0);
      if (sectionChars < MIN_SECTION_CONTEXT_CHARS) {
        // Thin (heading-only) section: pull topically similar chunks from the whole
        // material so quotes can anchor to real text, and keep the section title as the
        // topic focus so questions stay on the section's theme.
        topicTitle = `${content.title} — ${sectionCtx.sectionTitle}`;
        const widened = await searchSimilarChunks(contentId, sectionCtx.sectionTitle, 10, {
          userId: content.userId,
          metadata: { contentId, quizId },
        });
        const widenedChars = widened.reduce((sum, c) => sum + c.text.length, 0);
        if (widenedChars > sectionChars) chunks = widened;
      }
    } else {
      chunks = await searchSimilarChunks(contentId, content.title, 10, {
        userId: content.userId,
        metadata: { contentId, quizId },
      });
    }
    const context = buildRagContext(chunks);

    const result = await generateJsonCompletion<{ questions: GeneratedQuestion[] }>(
      [
        { role: 'system', content: getQuestionGenSystemPrompt(locale) },
        {
          role: 'user',
          content: buildQuestionGenPrompt(locale, {
            title: topicTitle,
            context,
            count: overgenerateCount(count),
            types: requestedTypes,
            depth,
          }),
        },
      ],
      {
        usage: {
          userId: content.userId,
          feature: 'QUIZ_GEN',
          metadata: { contentId, quizId },
        },
      },
    );

    const generated = result.questions ?? [];
    if (generated.length === 0) {
      throw new Error('No quiz questions generated');
    }

    const { questions, skipped } = postprocessGeneratedQuestions({
      generated,
      context,
      count,
      allowedTypes: requestedTypes as QuestionType[] | null,
      normalizeType: normalizePracticeQuestionType,
    });

    if (questions.length === 0) {
      throw new Error(`No valid quiz questions generated (skipped ${skipped})`);
    }

    // Section provenance for per-section mastery (full-content quizzes resolve per item).
    const sections = sectionId
      ? []
      : await prisma.contentSection.findMany({
          where: { contentId },
          select: { id: true, startChunk: true, endChunk: true },
        });

    await prisma.quizQuestion.deleteMany({ where: { quizId } });
    for (const q of questions) {
      await prisma.quizQuestion.create({
        data: {
          quizId,
          question: q.prompt,
          type: q.type,
          options: q.options ? q.options : Prisma.JsonNull,
          // Legacy single-answer field, kept for backward-compatible multiple-choice grading.
          correctAnswer: q.acceptableAnswers[0] ?? '',
          acceptableAnswers: q.acceptableAnswers,
          config: q.config ? (q.config as Prisma.InputJsonValue) : Prisma.JsonNull,
          explanation: q.explanation,
          difficulty: q.difficulty,
          bloom: q.bloom,
          sourceQuote: q.sourceQuote,
          optionRationales: q.optionRationales
            ? (q.optionRationales as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          sourceSectionId: sectionId ?? resolveSourceSection(q.sourceQuote, chunks, sections),
        },
      });
    }

    if (skipped > 0) {
      console.warn(
        `generateQuiz: skipped ${skipped} invalid question(s) for quiz ${quizId} (created ${questions.length})`,
      );
    }
    jobEvents.publish(content.userId, { type: 'quiz.status', quizId, contentId, status: 'READY' });
  });

  quizQueue.on('failed', async (job, err) => {
    console.error(`Quiz job ${job?.id} failed:`, err.message);
    // Quiz has no status column, so a hard failure would otherwise make the client poll
    // forever — push a FAILED so it can stop.
    const data = job?.data as GenerateQuizJobData | undefined;
    if (!data?.quizId) return;
    const owner = await prisma.content.findUnique({
      where: { id: data.contentId },
      select: { userId: true },
    });
    if (owner) {
      jobEvents.publish(owner.userId, {
        type: 'quiz.status',
        quizId: data.quizId,
        contentId: data.contentId,
        status: 'FAILED',
      });
    }
  });
}
