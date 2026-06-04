import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getOrderedChunks, buildRagContext } from '../services/rag.service.js';
import { generateChatCompletion } from '../services/ai.service.js';
import { buildSummaryUserPrompt, SUMMARY_SYSTEM_PROMPT } from '../lib/summary-prompt.js';
import { getParam } from '../lib/params.js';

export async function generateSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'contentId');

  const content = await prisma.content.findFirst({
    where: { id: contentId, userId: req.user.userId, status: 'READY' },
  });
  if (!content) throw new AppError(404, 'Content not found or not ready');

  const chunks = await getOrderedChunks(contentId);
  if (chunks.length === 0) {
    throw new AppError(400, 'No content text available for summary');
  }

  const context = buildRagContext(chunks);

  const summary = await generateChatCompletion([
    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: buildSummaryUserPrompt(content.title, context) },
  ]);

  res.json({ summary, contentId });
}
