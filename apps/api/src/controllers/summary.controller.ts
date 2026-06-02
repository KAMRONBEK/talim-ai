import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { searchSimilarChunks, buildRagContext } from '../services/rag.service.js';
import { generateChatCompletion } from '../services/ai.service.js';
import { getParam } from '../lib/params.js';

export async function generateSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');

  const chunks = await searchSimilarChunks(contentId, `summary of ${content.title}`, 15);
  const context = buildRagContext(chunks);

  const summary = await generateChatCompletion([
    {
      role: 'system',
      content:
        'You are an expert tutor. Create a clear, structured summary with key points and takeaways from the provided content.',
    },
    {
      role: 'user',
      content: `Title: ${content.title}\n\nContent:\n${context}\n\nProvide a comprehensive summary.`,
    },
  ]);

  res.json({ summary, contentId });
}
