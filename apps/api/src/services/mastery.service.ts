import type { AppLocale, ClassMastery, MasteryTopic } from '@talim/types';
import { DEFAULT_LOCALE } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { getAssignedContentIds, resolveTenantIdForUser } from './contentAccess.service.js';
import { SECTION_COMPLETE_THRESHOLD } from './learningProgress.service.js';

// Fallback shown when a section row lost its title (e.g. the section was deleted
// after progress was recorded). Uzbek "Section" to match the default locale.
const DEFAULT_TOPIC_TITLE = "Bo'lim";

export interface LearnerMastery {
  overallMastery: number;
  masteryByTopic: MasteryTopic[];
  materialsDone: number;
}

function roundPct(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round(value);
}

/**
 * Batch-resolve display titles for a set of sections, applying the localized
 * ContentSectionTitle override when the locale is not the default (uz base).
 * One or two queries total — never per-section (avoids N+1).
 */
async function resolveSectionTitles(
  sectionIds: string[],
  locale: AppLocale,
): Promise<Map<string, string>> {
  if (sectionIds.length === 0) return new Map();
  const sections = await prisma.contentSection.findMany({
    where: { id: { in: sectionIds } },
    select: { id: true, title: true },
  });
  const map = new Map(sections.map((s) => [s.id, s.title]));
  if (locale !== 'uz') {
    const localized = await prisma.contentSectionTitle.findMany({
      where: { sectionId: { in: sectionIds }, locale },
      select: { sectionId: true, title: true },
    });
    for (const row of localized) map.set(row.sectionId, row.title);
  }
  return map;
}

/**
 * Per-learner mastery computed on read from existing progress rows, scoped to the
 * learner's assigned content in their (active) tenant. Pass an explicit tenantId
 * when the caller already has one (e.g. a tutor viewing a — possibly deactivated —
 * student); otherwise it is resolved via the active-membership guard.
 */
export async function getLearnerMastery(
  userId: string,
  opts?: { tenantId?: string | null; locale?: AppLocale },
): Promise<LearnerMastery> {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const tenantId =
    opts?.tenantId !== undefined
      ? opts.tenantId
      : await resolveTenantIdForUser(userId, 'TENANT_LEARNER');

  const empty: LearnerMastery = { overallMastery: 0, masteryByTopic: [], materialsDone: 0 };
  if (!tenantId) return empty;

  const contentIds = await getAssignedContentIds(userId, tenantId);
  if (contentIds.length === 0) return empty;

  const [overallAgg, materialsDone, sectionRows] = await Promise.all([
    prisma.contentProgress.aggregate({
      where: { userId, contentId: { in: contentIds } },
      _avg: { overallCoverage: true },
    }),
    prisma.contentProgress.count({
      where: {
        userId,
        contentId: { in: contentIds },
        overallCoverage: { gte: SECTION_COMPLETE_THRESHOLD },
      },
    }),
    prisma.sectionProgress.findMany({
      where: { userId, contentId: { in: contentIds } },
      select: { sectionId: true, coverageScore: true },
    }),
  ]);

  const titleMap = await resolveSectionTitles(
    sectionRows.map((r) => r.sectionId),
    locale,
  );

  const masteryByTopic: MasteryTopic[] = sectionRows
    .map((r) => ({
      sectionId: r.sectionId,
      title: titleMap.get(r.sectionId) ?? DEFAULT_TOPIC_TITLE,
      coverage: roundPct(r.coverageScore),
    }))
    .sort((a, b) => b.coverage - a.coverage);

  return {
    overallMastery: roundPct(overallAgg._avg.overallCoverage),
    masteryByTopic,
    materialsDone,
  };
}

/**
 * Class-wide mastery for a tenant: per-topic average across ACTIVE learners plus a
 * per-student overall-mastery distribution. Aggregated with groupBy so it stays a
 * fixed number of queries regardless of class size.
 */
export async function getClassMastery(
  tenantId: string,
  opts?: { locale?: AppLocale },
): Promise<ClassMastery> {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const emptyDistribution = { lt50: 0, b50_69: 0, b70_84: 0, gte85: 0 };

  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId, role: 'LEARNER', active: true },
    select: { userId: true },
  });
  const learnerIds = memberships.map((m) => m.userId);
  if (learnerIds.length === 0) return { byTopic: [], distribution: emptyDistribution };

  const [topicAgg, studentAgg] = await Promise.all([
    prisma.sectionProgress.groupBy({
      by: ['sectionId'],
      where: { userId: { in: learnerIds }, section: { content: { tenantId } } },
      _avg: { coverageScore: true },
    }),
    prisma.contentProgress.groupBy({
      by: ['userId'],
      where: { userId: { in: learnerIds }, content: { tenantId } },
      _avg: { overallCoverage: true },
    }),
  ]);

  const titleMap = await resolveSectionTitles(
    topicAgg.map((r) => r.sectionId),
    locale,
  );

  const byTopic: MasteryTopic[] = topicAgg
    .map((r) => ({
      sectionId: r.sectionId,
      title: titleMap.get(r.sectionId) ?? DEFAULT_TOPIC_TITLE,
      coverage: roundPct(r._avg.coverageScore),
    }))
    .sort((a, b) => b.coverage - a.coverage);

  const masteryMap = new Map(studentAgg.map((r) => [r.userId, r._avg.overallCoverage ?? 0]));
  const distribution = { ...emptyDistribution };
  for (const learnerId of learnerIds) {
    const mastery = masteryMap.get(learnerId) ?? 0;
    if (mastery < 50) distribution.lt50 += 1;
    else if (mastery < 70) distribution.b50_69 += 1;
    else if (mastery < 85) distribution.b70_84 += 1;
    else distribution.gte85 += 1;
  }

  return { byTopic, distribution };
}
