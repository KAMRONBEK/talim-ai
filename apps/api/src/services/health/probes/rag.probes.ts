import { prisma } from '../../../lib/prisma.js';
import { env } from '../../../config/env.js';
import { searchSimilarChunks } from '../../rag.service.js';
import type { ProbeDefinition } from '../runner.js';
import { errorMessage } from '../runner.js';

const SLOW_VECTOR_QUERY_MS = 1500;

const REINDEX_HINT =
  'Re-apply the DDL in apps/api/src/prisma/migrations/20260624010000_rag_hybrid/migration.sql via `docker compose exec db psql -U talim -d talim`, then run `ANALYZE "Chunk";`. If ranking is still wrong, rebuild the index: `REINDEX INDEX "Chunk_embedding_hnsw";`.';

export const ragProbes: ProbeDefinition[] = [
  {
    id: 'rag-retrieval-selftest',
    group: 'rag',
    label: 'Vector retrieval self-test',
    deep: false,
    timeoutMs: 8000,
    timeoutStatus: 'degraded',
    remediation: REINDEX_HINT,
    run: async () => {
      // Zero API cost: reuse a vector already stored in the DB as the query vector.
      // The chunk it came from must come back at rank 1 with distance ~0 — if it
      // does not, the HNSW index is corrupt and the tutor is silently retrieving
      // the wrong context rather than erroring.
      // No ORDER BY: Chunk has no timestamp column, and any embedded chunk proves
      // the index just as well — an unordered LIMIT 1 is also the cheapest read.
      const seed = await prisma.$queryRaw<{ id: string; contentId: string; emb: string }[]>`
        SELECT id, "contentId", embedding::text AS emb
          FROM "Chunk"
         WHERE embedding IS NOT NULL
         LIMIT 1`;
      const chunk = seed[0];
      if (!chunk) {
        return {
          status: 'skipped' as const,
          message: 'No embedded chunks yet — upload a document to exercise retrieval.',
        };
      }

      const startedAt = Date.now();
      const hits = await prisma.$queryRawUnsafe<{ id: string; distance: number }[]>(
        `SELECT id, (embedding <=> $2::vector) AS distance
           FROM "Chunk"
          WHERE "contentId" = $1 AND embedding IS NOT NULL
          ORDER BY embedding <=> $2::vector
          LIMIT 5`,
        chunk.contentId,
        chunk.emb,
      );
      const vectorMs = Date.now() - startedAt;

      // Compare DISTANCE, not id: repeated boilerplate (PDF headers/footers) yields
      // byte-identical chunks and therefore identical vectors, so an exact-match tie
      // can legitimately rank a different row first. A ~0 distance at rank 1 proves
      // the index found the exact vector, which is what we actually care about.
      const topDistance = Number(hits[0]?.distance ?? Number.NaN);
      if (!Number.isFinite(topDistance) || topDistance > 1e-6) {
        return {
          status: 'down' as const,
          message: `Vector search failed to return an exact match for a vector taken straight from the index (best distance ${Number.isFinite(topDistance) ? topDistance.toExponential(2) : 'n/a'}) — the HNSW index is stale or corrupt, so the tutor is retrieving the wrong context.`,
          detail: { vectorMs, topDistance: Number.isFinite(topDistance) ? topDistance : null },
        };
      }

      // Lexical arm: a missing/unpopulated tsv column zeroes the keyword half of
      // hybrid retrieval without raising anything.
      let lexicalOk = true;
      let lexicalError: string | null = null;
      try {
        // Bounded existence check: `LIMIT 1` on an aggregate bounds the RESULT, not
        // the scan, so a bare count here would seq-scan the whole Chunk table and
        // could blow the probe budget on a large corpus.
        const lexical = await prisma.$queryRaw<{ n: number }[]>`
          SELECT count(*)::int AS n FROM (SELECT 1 FROM "Chunk" WHERE tsv IS NOT NULL LIMIT 1) t`;
        lexicalOk = (lexical[0]?.n ?? 0) > 0;
      } catch (error) {
        lexicalOk = false;
        lexicalError = errorMessage(error);
      }

      const detail = { vectorMs, chunksSearched: hits.length, lexicalArm: lexicalOk };

      if (!lexicalOk) {
        return {
          status: 'degraded' as const,
          message: `Dense search works (${vectorMs}ms), but the lexical arm is unavailable${lexicalError ? `: ${lexicalError}` : ' — the tsv column is empty'}. Keyword matches will be missed.`,
          detail,
        };
      }
      if (vectorMs > SLOW_VECTOR_QUERY_MS) {
        return {
          status: 'degraded' as const,
          message: `Retrieval is correct but slow (${vectorMs}ms) — likely a sequential scan, which will time the tutor out under load.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `Dense + lexical arms both healthy · exact vector match returned at rank 1 in ${vectorMs}ms.`,
        detail,
      };
    },
  },
  {
    id: 'rag-e2e-deep',
    group: 'rag',
    label: 'RAG end-to-end (live embedding)',
    deep: true,
    timeoutMs: 25000,
    timeoutStatus: 'degraded',
    remediation: `If this fails while OpenAI embeddings are green, the index is the problem. ${REINDEX_HINT}`,
    run: async () => {
      // Exercise the REAL production path: embed a fresh query and run the full
      // hybrid retrieval (dual-script dense arms + lexical + fusion). This is the
      // only check that proves the tutor will actually have context to answer with.
      const content = await prisma.content.findFirst({
        where: { status: 'READY', chunks: { some: {} } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      });
      if (!content) {
        return { status: 'skipped' as const, message: 'No READY content with chunks — nothing to retrieve against yet.' };
      }

      const source = await prisma.chunk.findFirst({
        where: { contentId: content.id },
        orderBy: { chunkIndex: 'asc' },
        select: { text: true, chunkIndex: true },
      });
      if (!source) {
        return { status: 'skipped' as const, message: 'Selected content has no readable chunk text.' };
      }

      const query = source.text.slice(0, 200);
      const startedAt = Date.now();
      const results = await searchSimilarChunks(content.id, query);
      const elapsed = Date.now() - startedAt;

      if (results.length === 0) {
        return {
          status: 'down' as const,
          message: `Full retrieval returned NOTHING for text taken from the document itself — the tutor would answer with no context. Content: "${content.title}".`,
          detail: { contentId: content.id, elapsedMs: elapsed, locale: env.DEFAULT_CONTENT_LOCALE },
        };
      }

      const topThree = results.slice(0, 3).map((r) => r.chunkIndex);
      const foundSource = topThree.includes(source.chunkIndex);
      const detail = {
        contentTitle: content.title,
        results: results.length,
        elapsedMs: elapsed,
        sourceRankedTop3: foundSource,
      };

      if (!foundSource) {
        return {
          status: 'degraded' as const,
          message: `Retrieval works (${results.length} hits in ${elapsed}ms) but the source passage did not rank in the top 3 — recall has degraded and answers may cite the wrong section.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `End-to-end retrieval healthy — ${results.length} hits in ${elapsed}ms, source passage ranked in the top 3.`,
        detail,
      };
    },
  },
];
