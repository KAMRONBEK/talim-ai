import type { JobEvent } from '@talim/types';
import { prisma } from '../../lib/prisma.js';
import { jobEvents } from './jobEvents.service.js';

/**
 * Resolve the full audience for a content: the owner (uploader) and — for tenant
 * materials — every actively-enrolled learner it is assigned to. Returns the distinct
 * user ids. Callers that emit several events for the same content in one job (e.g.
 * `autoGenerateSectionDecks`) should resolve once and reuse via `publishContentEventTo`
 * rather than re-running this query per event.
 */
export async function resolveContentAudience(contentId: string): Promise<string[]> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { userId: true, tenantId: true },
  });
  if (!content) return [];
  const recipients = new Set<string>([content.userId]);
  if (content.tenantId) {
    const assignees = await prisma.contentAssignment.findMany({
      where: {
        contentId,
        learner: {
          tenantMemberships: { some: { tenantId: content.tenantId, active: true } },
        },
      },
      select: { learnerId: true },
    });
    for (const a of assignees) recipients.add(a.learnerId);
  }
  return [...recipients];
}

/**
 * Publish a job event to a pre-resolved recipient set. The SSE bus is keyed per user,
 * so we fan out over the recipients (mirrors the leaderboard.update fan-out in
 * assessment/learner.ts). Events are id-only; recipients refetch through REST, which
 * re-runs `assertCanAccessContent`, so over-delivery can never leak data. Synchronous
 * and total — publishing must never break the caller.
 */
export function publishContentEventTo(recipients: readonly string[], event: JobEvent): void {
  for (const recipient of recipients) jobEvents.publish(recipient, event);
}

/**
 * Publish a content-scoped job event to everyone who can currently see that content
 * (owner + assigned active learners). Delivery must never break the publishing job, so
 * every failure here is swallowed. Prefer `resolveContentAudience` + `publishContentEventTo`
 * when emitting multiple events for the same content in a loop.
 */
export async function publishContentEvent(contentId: string, event: JobEvent): Promise<void> {
  try {
    publishContentEventTo(await resolveContentAudience(contentId), event);
  } catch (err) {
    console.error('publishContentEvent: fan-out failed', err);
  }
}
