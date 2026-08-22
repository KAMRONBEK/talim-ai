import { prisma } from '../../../lib/prisma.js';
import type { ProbeDefinition } from '../runner.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Bound the NULL-embedding scan: `Chunk.embedding` has no b-tree index. */
const NULL_EMBEDDING_SCAN_LIMIT = 1001;

function dayAgo(): Date {
  return new Date(Date.now() - DAY_MS);
}

function titleList(rows: { title: string | null }[]): string {
  return rows
    .map((r) => r.title?.slice(0, 40) ?? 'untitled')
    .slice(0, 3)
    .join(', ');
}

export const dataIntegrityProbes: ProbeDefinition[] = [
  {
    id: 'ready-zero-chunks',
    group: 'data-integrity',
    label: 'READY content with no chunks',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation:
      'These items look fine to the learner but the tutor has nothing to retrieve. Re-ingest each one: delete and re-upload from Admin → Content, or use the reparse flow in the tutor UI. If several appeared at once, check the OpenAI embedding check above first.',
    run: async () => {
      // The nastiest silent failure: content is marked READY, the learner opens it,
      // asks a question, and the tutor answers generically because there is no
      // context to retrieve. Nothing errors anywhere.
      const [count, samples] = await Promise.all([
        prisma.content.count({ where: { status: 'READY', chunks: { none: {} } } }),
        prisma.content.findMany({
          where: { status: 'READY', chunks: { none: {} } },
          select: { id: true, title: true },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        }),
      ]);

      if (count > 0) {
        return {
          status: 'degraded' as const,
          message: `${count} document(s) are marked READY but have zero chunks — the AI tutor will answer without any source material for them. E.g. ${titleList(samples)}.`,
          detail: { count, examples: titleList(samples) },
        };
      }
      return { status: 'ok' as const, message: 'Every READY document has indexed chunks.', detail: { count: 0 } };
    },
  },
  {
    id: 'null-embeddings',
    group: 'data-integrity',
    label: 'Chunks missing embeddings',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation:
      'Inspect the affected documents with `pnpm --filter @talim/api inspect-chunks`, then re-ingest them. Widespread NULLs almost always mean the embedding API was failing during ingest — check the OpenAI embeddings check above first.',
    run: async () => {
      // Bounded subquery instead of a bare count(*): embedding has no index, so an
      // unbounded scan on a large Chunk table would be an expensive probe.
      const rows = await prisma.$queryRaw<{ n: number }[]>`
        SELECT count(*)::int AS n
          FROM (SELECT 1 FROM "Chunk" WHERE embedding IS NULL LIMIT ${NULL_EMBEDDING_SCAN_LIMIT}) t`;
      const n = rows[0]?.n ?? 0;
      const label = n >= NULL_EMBEDDING_SCAN_LIMIT ? `${NULL_EMBEDDING_SCAN_LIMIT - 1}+` : String(n);

      if (n > 0) {
        return {
          status: 'degraded' as const,
          message: `${label} chunk(s) have no embedding and are invisible to vector search — those passages can never be retrieved.`,
          detail: { count: label },
        };
      }
      return { status: 'ok' as const, message: 'Every chunk has an embedding.', detail: { count: 0 } };
    },
  },
  {
    id: 'failed-content-24h',
    group: 'data-integrity',
    label: 'Failed ingests (24h)',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation:
      'Retry each item from Admin → Content (the Retry button hits the ingest job again). If retries keep failing, a red AI-provider check above is almost always the root cause — fix that first.',
    run: async () => {
      const since = dayAgo();
      const [count, samples] = await Promise.all([
        prisma.content.count({ where: { status: 'FAILED', updatedAt: { gte: since } } }),
        prisma.content.findMany({
          where: { status: 'FAILED', updatedAt: { gte: since } },
          select: { id: true, title: true },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        }),
      ]);

      if (count > 0) {
        return {
          status: 'degraded' as const,
          message: `${count} document ingest(s) failed in the last 24 hours. E.g. ${titleList(samples)}.`,
          detail: { count, examples: titleList(samples) },
        };
      }
      return { status: 'ok' as const, message: 'No failed ingests in the last 24 hours.', detail: { count: 0 } };
    },
  },
  {
    id: 'failed-media-24h',
    group: 'data-integrity',
    label: 'Failed media generations (24h)',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation:
      'Regenerate from the tutor/content UI using the per-part generate/retry buttons. If podcasts are failing, fix Azure TTS first; if slides or question banks are failing, fix DeepSeek first.',
    run: async () => {
      const since = dayAgo();
      const [podcasts, videos, decks, flashcards, banks, bankErrors] = await Promise.all([
        prisma.podcast.count({ where: { status: 'FAILED', updatedAt: { gte: since } } }),
        prisma.contentVideo.count({ where: { status: 'FAILED', updatedAt: { gte: since } } }),
        prisma.contentSlideDeck.count({ where: { status: 'FAILED', updatedAt: { gte: since } } }),
        prisma.flashcardDeck.count({ where: { status: 'FAILED', updatedAt: { gte: since } } }),
        prisma.questionBank.count({ where: { generationStatus: 'FAILED', updatedAt: { gte: since } } }),
        // QuestionBank.generationError is the only persisted error text in the
        // system — worth surfacing verbatim, it usually names the real cause.
        prisma.questionBank.findMany({
          where: { generationStatus: 'FAILED', updatedAt: { gte: since }, generationError: { not: null } },
          select: { generationError: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        }),
      ]);

      const total = podcasts + videos + decks + flashcards + banks;
      const detail: Record<string, string | number> = {
        podcasts,
        videos,
        slideDecks: decks,
        flashcardDecks: flashcards,
        questionBanks: banks,
      };
      const firstError = bankErrors[0]?.generationError;
      if (firstError) detail.lastError = firstError.slice(0, 160);

      if (total > 0) {
        const parts = [
          podcasts ? `${podcasts} podcast` : null,
          videos ? `${videos} video` : null,
          decks ? `${decks} slide deck` : null,
          flashcards ? `${flashcards} flashcard deck` : null,
          banks ? `${banks} question bank` : null,
        ].filter(Boolean);
        return {
          status: 'degraded' as const,
          message: `${total} media generation(s) failed in the last 24 hours (${parts.join(', ')}).${firstError ? ` Last error: ${firstError.slice(0, 120)}` : ''}`,
          detail,
        };
      }
      return { status: 'ok' as const, message: 'No failed media generations in the last 24 hours.', detail };
    },
  },
  {
    id: 'ai-usage-pulse',
    group: 'data-integrity',
    label: 'AI usage pulse',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    // Informational only — there is nothing to fix, so the UI never shows a callout.
    remediation:
      'Nothing to fix — this is a passive signal. If the last call is days old and you expected activity, run the deep check to verify the providers end to end.',
    run: async () => {
      const since = dayAgo();
      const [last, aggregate] = await Promise.all([
        prisma.apiUsageEvent.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, feature: true, model: true },
        }),
        prisma.apiUsageEvent.aggregate({
          where: { createdAt: { gte: since } },
          _count: { id: true },
          _sum: { estimatedCostUsd: true },
        }),
      ]);

      const calls24h = aggregate._count.id;
      const spend24h = Number(aggregate._sum.estimatedCostUsd ?? 0);

      if (!last) {
        return {
          status: 'ok' as const,
          message: 'No AI calls recorded yet — a fresh install, or nobody has used the platform.',
          detail: { calls24h: 0, spend24hUsd: 0 },
        };
      }

      const ageMinutes = Math.round((Date.now() - last.createdAt.getTime()) / 60000);
      const ageLabel =
        ageMinutes < 60
          ? `${ageMinutes}m ago`
          : ageMinutes < 60 * 24
            ? `${Math.round(ageMinutes / 60)}h ago`
            : `${Math.round(ageMinutes / (60 * 24))}d ago`;

      // Always `ok`: a quiet platform is not a fault. This is a positive signal —
      // recent metered calls prove the keys work in practice, not just on paper.
      return {
        status: 'ok' as const,
        message: `Last AI call ${ageLabel} (${last.feature}, ${last.model}) · ${calls24h} calls and $${spend24h.toFixed(4)} spent in 24h.`,
        detail: {
          lastCallAt: last.createdAt.toISOString(),
          lastFeature: last.feature,
          lastModel: last.model,
          calls24h,
          spend24hUsd: Number(spend24h.toFixed(4)),
        },
      };
    },
  },
];
