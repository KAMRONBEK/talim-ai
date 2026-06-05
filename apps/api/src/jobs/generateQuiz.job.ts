import { prisma } from '../lib/prisma.js';
import { generateJsonCompletion } from '../services/ai.service.js';
import { searchSimilarChunks, buildRagContext } from '../services/rag.service.js';
import { quizQueue, type GenerateQuizJobData } from '../services/queue.service.js';
import { resolveCorrectAnswer } from '../lib/quiz-answer.js';
import { QUIZ_SYSTEM_PROMPT, buildQuizUserPrompt } from '../lib/quiz-prompt.js';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function registerGenerateQuizJob(): void {
  quizQueue.process(async (job) => {
    const { contentId, quizId } = job.data as GenerateQuizJobData;

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    const chunks = await searchSimilarChunks(contentId, content.title, 10);
    const context = buildRagContext(chunks);

    const result = await generateJsonCompletion<{ questions: GeneratedQuestion[] }>([
      { role: 'system', content: QUIZ_SYSTEM_PROMPT },
      { role: 'user', content: buildQuizUserPrompt(content.title, context) },
    ]);

    const questions = result.questions ?? [];
    if (questions.length === 0) {
      throw new Error('No quiz questions generated');
    }

    await prisma.quizQuestion.deleteMany({ where: { quizId } });

    for (const q of questions) {
      await prisma.quizQuestion.create({
        data: {
          quizId,
          question: q.question,
          options: q.options,
          correctAnswer: resolveCorrectAnswer(q.options, q.correctAnswer),
          explanation: q.explanation,
        },
      });
    }
  });

  quizQueue.on('failed', (job, err) => {
    console.error(`Quiz job ${job?.id} failed:`, err.message);
  });
}
