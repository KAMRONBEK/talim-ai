import { Prisma, type QuizKind } from '@prisma/client';
import { parseAppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from '../services/ai.service.js';
import { searchSimilarChunks, buildRagContext } from '../services/rag.service.js';
import { quizQueue, type GenerateQuizJobData } from '../services/queue.service.js';
import { getQuizSystemPrompt, buildQuizUserPrompt } from '../lib/locale-prompts.js';
import { getQuestionCount } from '../lib/quiz-prompt.js';
import { normalizeQuestionType, type QuestionStyle } from '../lib/assessment-prompt.js';
import {
  type GeneratedQuestion,
  isAnswerableMultipleChoice,
  jsonStringArray,
} from '../services/assessment/shared.js';

async function getSectionContext(contentId: string, sectionId: string): Promise<string> {
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

  return buildRagContext(chunks.map((c) => ({ text: c.text, chunkIndex: c.chunkIndex })));
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

    let context: string;
    if (sectionId) {
      context = await getSectionContext(contentId, sectionId);
    } else {
      const chunks = await searchSimilarChunks(contentId, content.title, 10, {
        userId: content.userId,
        metadata: { contentId, quizId },
      });
      context = buildRagContext(chunks);
    }

    const result = await generateJsonCompletion<{ questions: GeneratedQuestion[] }>(
      [
        { role: 'system', content: getQuizSystemPrompt(locale) },
        { role: 'user', content: buildQuizUserPrompt(locale, content.title, context, { style, count }) },
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

    await prisma.quizQuestion.deleteMany({ where: { quizId } });

    let created = 0;
    let skipped = 0;
    for (const q of generated) {
      const acceptableAnswers = jsonStringArray(q.acceptableAnswers);
      if (!q.prompt || !acceptableAnswers.length) {
        skipped++;
        continue;
      }
      const type = normalizeQuestionType(q.type);
      const options = Array.isArray(q.options) ? jsonStringArray(q.options) : null;
      // Never persist an unanswerable multiple-choice question (no option matches the answer).
      if (type === 'MULTIPLE_CHOICE' && !isAnswerableMultipleChoice(options, acceptableAnswers)) {
        skipped++;
        continue;
      }
      await prisma.quizQuestion.create({
        data: {
          quizId,
          question: q.prompt,
          type,
          options: type === 'MULTIPLE_CHOICE' && options ? options : Prisma.JsonNull,
          // Legacy single-answer field, kept for backward-compatible multiple-choice grading.
          correctAnswer: acceptableAnswers[0] ?? '',
          acceptableAnswers,
          explanation: q.explanation ?? null,
        },
      });
      created++;
    }

    if (created === 0) {
      throw new Error(`No valid quiz questions generated (skipped ${skipped})`);
    }
    if (skipped > 0) {
      console.warn(`generateQuiz: skipped ${skipped} invalid question(s) for quiz ${quizId} (created ${created})`);
    }
  });

  quizQueue.on('failed', (job, err) => {
    console.error(`Quiz job ${job?.id} failed:`, err.message);
  });
}
