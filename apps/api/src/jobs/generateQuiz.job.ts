import { Prisma } from '@prisma/client';
import { parseAppLocale, type QuestionDepth } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { searchSimilarChunks, buildRagContext } from '../services/rag.service.js';
import { quizQueue, type GenerateQuizJobData } from '../services/queue.service.js';
import { publishContentEvent } from '../services/events/jobEventAudience.js';
import { type QuestionStyle } from '../lib/assessment-prompt.js';
import {
  normalizePracticeQuestionType,
  typesFromStyle,
  GENERATABLE_TYPES,
  type GeneratableQuestionType,
} from '../lib/question-gen-prompt.js';
import { generateQuestionSet } from '../lib/question-gen.js';
import { sampleChunksEvenly, MIN_SECTION_CONTEXT_CHARS } from '../lib/chunk-sampling.js';

interface ContextChunk {
  text: string;
  chunkIndex: number;
}

/**
 * Whole-material context: an even spread of chunks across the document, sized to the
 * requested question count. Title-similarity retrieval clustered around the intro and
 * starved later sections — an even spread grounds questions (and their sourceQuote
 * anchors) across the whole material.
 */
function wholeMaterialTarget(count: number): number {
  return Math.min(30, Math.max(12, Math.ceil(count * 1.6)));
}

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

    const style: QuestionStyle = jobStyle ?? (quiz?.style as QuestionStyle) ?? 'mixed';
    const count = jobCount ?? quiz?.count ?? 5;
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
      chunks = await sampleChunksEvenly(contentId, wholeMaterialTarget(count));
    }
    const context = buildRagContext(chunks);

    // B2C mixed practice draws from the full generatable set — including self-graded
    // FLASHCARD items (tenant banks pass their own flashcard-free type set).
    const effectiveTypes = requestedTypes ?? [...GENERATABLE_TYPES];

    const { questions, skipped, breakdown, passes } = await generateQuestionSet({
      locale,
      title: topicTitle,
      context,
      count,
      types: effectiveTypes,
      depth,
      normalizeType: normalizePracticeQuestionType,
      usage: {
        userId: content.userId,
        feature: 'QUIZ_GEN',
        metadata: { contentId, quizId },
      },
    });

    if (questions.length === 0) {
      throw new Error(
        `No valid quiz questions generated (skipped ${skipped}: ${JSON.stringify(breakdown)})`,
      );
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

    if (skipped > 0 || questions.length < count) {
      console.warn(
        `generateQuiz: quiz ${quizId} delivered ${questions.length}/${count} in ${passes} pass(es), skipped ${skipped} ${JSON.stringify(breakdown)}`,
      );
    }
    void publishContentEvent(contentId, { type: 'quiz.status', quizId, contentId, status: 'READY' });
  });

  quizQueue.on('failed', async (job, err) => {
    console.error(`Quiz job ${job?.id} failed:`, err.message);
    // Quiz has no status column, so a hard failure would otherwise make the client poll
    // forever — push a FAILED so it can stop.
    const data = job?.data as GenerateQuizJobData | undefined;
    if (!data?.quizId) return;
    await publishContentEvent(data.contentId, {
      type: 'quiz.status',
      quizId: data.quizId,
      contentId: data.contentId,
      status: 'FAILED',
    });
  });
}
