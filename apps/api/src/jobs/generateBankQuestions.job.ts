import { prisma } from '../lib/prisma.js';
import {
  bankQuestionsQueue,
  type GenerateBankQuestionsJobData,
} from '../services/queue.service.js';
import { generateQuestions } from '../services/assessment/banks.js';
import { jobEvents } from '../services/events/jobEvents.service.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Publish `bank.status` to the tenant OWNER. Banks are tenant-scoped (not content-scoped),
 * so this resolves the audience via the bank's tenant.ownerId instead of publishContentEvent.
 * Event delivery must never fail the job — all errors are swallowed.
 */
async function publishBankStatus(bankId: string, status: 'READY' | 'FAILED'): Promise<void> {
  try {
    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      select: { tenant: { select: { ownerId: true } } },
    });
    const ownerId = bank?.tenant.ownerId;
    if (ownerId) jobEvents.publish(ownerId, { type: 'bank.status', bankId, status });
  } catch (err) {
    console.error(`bank.status publish failed for bank ${bankId}:`, err);
  }
}

export function registerGenerateBankQuestionsJob(): void {
  bankQuestionsQueue.process(async (job) => {
    const { bankId, tenantId, userId, input } = job.data as GenerateBankQuestionsJobData;
    // Same service the old synchronous endpoint ran (validation, material-default
    // context, QUESTION_DRAFT usage metering, question persistence).
    await generateQuestions(tenantId, userId, bankId, input);
    await prisma.questionBank.update({
      where: { id: bankId },
      data: { generationStatus: 'READY', generationError: null },
    });
    void publishBankStatus(bankId, 'READY');
  });

  bankQuestionsQueue.on('failed', async (job, err) => {
    console.error(`Bank question generation job ${job?.id} failed:`, err.message);
    const data = job?.data as GenerateBankQuestionsJobData | undefined;
    if (!data?.bankId) return;
    // Release the GENERATING claim so the tutor can retry, then tell their tabs to refetch.
    // Only deliberately user-facing AppError messages (validation, "not enough content")
    // are persisted for display; SDK/Prisma/network internals collapse to a generic
    // message (the raw error is already console.error'd above).
    const userMessage =
      err instanceof AppError ? err.message : 'Generation failed. Please try again.';
    await prisma.questionBank
      .update({
        where: { id: data.bankId },
        data: { generationStatus: 'FAILED', generationError: userMessage.slice(0, 500) },
      })
      .catch(() => undefined);
    void publishBankStatus(data.bankId, 'FAILED');
  });
}
