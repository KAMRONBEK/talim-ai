import type { Prisma, UsageFeature } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { estimateTokenCostUsd } from '../config/usage-pricing.js';

export interface UsageContext {
  userId: string;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RecordUsageInput {
  userId: string;
  tenantId?: string | null;
  feature: UsageFeature;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  metadata?: Record<string, unknown>;
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  return estimateTokenCostUsd(model, inputTokens, outputTokens);
}

// Returns the write promise so callers that need the usage persisted before the
// next quota check (e.g. sequential generation loops) can await it; fire-and-forget
// callers may ignore it.
export function recordUsage(input: RecordUsageInput): Promise<void> {
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const estimatedCostUsd = estimateCost(input.model, inputTokens, outputTokens);

  return prisma.apiUsageEvent
    .create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId ?? null,
        feature: input.feature,
        model: input.model,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .then(() => {})
    .catch((err) => {
      console.error('Failed to record API usage:', err);
    });
}

export async function getUsageForPeriod(params: {
  userId?: string;
  tenantId?: string;
  from: Date;
  to: Date;
}) {
  const where = {
    createdAt: { gte: params.from, lte: params.to },
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.tenantId ? { tenantId: params.tenantId } : {}),
  };

  const events = await prisma.apiUsageEvent.findMany({ where });
  const byFeature: Record<string, { inputTokens: number; outputTokens: number; costUsd: number; count: number }> =
    {};

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;

  for (const event of events) {
    totalInputTokens += event.inputTokens;
    totalOutputTokens += event.outputTokens;
    totalCostUsd += Number(event.estimatedCostUsd);
    const key = event.feature;
    if (!byFeature[key]) {
      byFeature[key] = { inputTokens: 0, outputTokens: 0, costUsd: 0, count: 0 };
    }
    byFeature[key].inputTokens += event.inputTokens;
    byFeature[key].outputTokens += event.outputTokens;
    byFeature[key].costUsd += Number(event.estimatedCostUsd);
    byFeature[key].count += 1;
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    eventCount: events.length,
    byFeature,
  };
}
