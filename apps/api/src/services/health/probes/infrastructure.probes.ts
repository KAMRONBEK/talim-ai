import { readFile, statfs } from 'node:fs/promises';
import { totalmem } from 'node:os';
import { prisma } from '../../../lib/prisma.js';
import { env } from '../../../config/env.js';
import { contentQueue } from '../../queue.service.js';
import { storageService } from '../../storage.service.js';
import type { ProbeDefinition } from '../runner.js';

// These budgets are deliberately loose. Every probe runs concurrently, so ~25 of
// them contend for the event loop while these two are being timed — the measured
// figure includes queueing delay, not just server round-trip. On a cold container
// straight after a deploy that inflates a healthy Redis PING to ~500ms, which a
// tighter threshold would report as degraded on every single deploy.
// A genuinely wedged dependency blows the probe's timeout instead of returning slow.
const SLOW_DB_MS = 1500;
const SLOW_REDIS_MS = 1000;
const LOW_DISK_BYTES = 1024 * 1024 * 1024; // 1 GiB
/** Warn once resident memory passes this share of the container's real limit. */
const RSS_WARN_RATIO = 0.8;
/** How long an unfinished migration is treated as "a deploy is still running". */
const MIGRATION_GRACE_MINUTES = 15;

/**
 * Read the container's real memory ceiling (cgroup v2, then v1). Hardcoding the
 * 512M prod limit would false-alarm anywhere else — local dev, a bigger VPS — and a
 * dashboard that cries wolf is worse than no dashboard. Returns null when
 * unlimited or unreadable (bare metal / macOS), in which case we skip the warning.
 */
async function containerMemoryLimitBytes(): Promise<number | null> {
  const candidates = ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes'];
  for (const path of candidates) {
    try {
      const raw = (await readFile(path, 'utf8')).trim();
      if (raw === 'max') return null;
      const value = Number(raw);
      // cgroup v1 reports a sentinel near 2^63 when no limit is set; anything at or
      // above physical RAM is effectively "unlimited" too.
      if (!Number.isFinite(value) || value <= 0 || value >= totalmem()) return null;
      return value;
    } catch {
      // Try the next path; absence is normal outside Linux containers.
    }
  }
  return null;
}

/** pgvector < 0.8 has no iterative index scan — long-document recall silently degrades. */
const MIN_PGVECTOR = [0, 8, 0] as const;

function isVersionBelow(version: string, minimum: readonly [number, number, number]): boolean {
  const parts = version.split('.').map((p) => Number.parseInt(p, 10));
  for (let i = 0; i < minimum.length; i += 1) {
    const floor = minimum[i] ?? 0;
    const part = parts[i];
    const actual = typeof part === 'number' && Number.isFinite(part) ? part : 0;
    if (actual !== floor) return actual < floor;
  }
  return false;
}

export const infrastructureProbes: ProbeDefinition[] = [
  {
    id: 'postgres-connectivity',
    group: 'infrastructure',
    label: 'PostgreSQL connection',
    deep: false,
    timeoutMs: 3000,
    timeoutStatus: 'down',
    remediation:
      'Run `docker compose ps db` and `docker compose up -d --wait db`. If it is up, verify DATABASE_URL in Doppler (`doppler secrets get DATABASE_URL -c prd`) and check `docker compose logs db --tail 50`.',
    run: async () => {
      const startedAt = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const elapsed = Date.now() - startedAt;
      return {
        status: elapsed > SLOW_DB_MS ? ('degraded' as const) : ('ok' as const),
        message:
          elapsed > SLOW_DB_MS
            ? `Reachable but slow — a trivial query took ${elapsed}ms.`
            : `Reachable (${elapsed}ms round-trip).`,
        detail: { queryMs: elapsed },
      };
    },
  },
  {
    id: 'postgres-migrations',
    group: 'infrastructure',
    label: 'Migrations applied',
    deep: false,
    timeoutMs: 3000,
    timeoutStatus: 'degraded',
    remediation:
      'Locally run `pnpm db:migrate:deploy` (never `migrate dev` — this DB has checksum drift). On the VPS: `docker compose exec api npx prisma migrate deploy`.',
    run: async () => {
      const rows = await prisma.$queryRaw<
        {
          migration_name: string;
          started_at: Date | null;
          finished_at: Date | null;
          rolled_back_at: Date | null;
        }[]
      >`SELECT migration_name, started_at, finished_at, rolled_back_at
          FROM "_prisma_migrations"
         ORDER BY started_at DESC`;

      // Group by name before judging. A migration that was rolled back and later
      // re-applied leaves BOTH rows behind forever — flagging the stale rollback
      // row would report a permanent false alarm on a perfectly healthy schema.
      // Only a name with no successful attempt at all is genuinely broken.
      interface Attempt {
        applied: boolean;
        rolledBack: boolean;
        startedAt: Date | null;
      }
      const attemptsByName = new Map<string, Attempt>();
      for (const row of rows) {
        const entry = attemptsByName.get(row.migration_name) ?? {
          applied: false,
          rolledBack: false,
          startedAt: null,
        };
        if (row.finished_at !== null) entry.applied = true;
        if (row.rolled_back_at !== null) entry.rolledBack = true;
        // Rows are newest-first, so the first one seen is the latest attempt.
        if (entry.startedAt === null) entry.startedAt = row.started_at;
        attemptsByName.set(row.migration_name, entry);
      }

      const unfinished = [...attemptsByName.entries()].filter(([, state]) => !state.applied);
      // Prisma writes the row (started_at set, finished_at NULL) BEFORE running the
      // SQL, so a migration executing right now looks identical to a failed one.
      // Give a running deploy a grace window rather than screaming mid-deploy.
      const runningCutoff = Date.now() - MIGRATION_GRACE_MINUTES * 60 * 1000;
      const inProgress = unfinished.filter(
        ([, s]) => !s.rolledBack && s.startedAt !== null && s.startedAt.getTime() > runningCutoff,
      );
      const broken = unfinished.filter((entry) => !inProgress.includes(entry)).map(([name]) => name);

      const healedCount = [...attemptsByName.values()].filter((s) => s.applied && s.rolledBack).length;
      const latest = rows.find((r) => r.finished_at !== null)?.migration_name ?? '(none)';
      const appliedCount = attemptsByName.size - unfinished.length;

      if (broken.length > 0) {
        return {
          status: 'down' as const,
          message: `${broken.length} migration(s) never completed — the schema is half-applied. First: ${broken[0]}.`,
          detail: { applied: appliedCount, broken: broken.length, latest },
        };
      }
      if (inProgress.length > 0) {
        return {
          status: 'degraded' as const,
          message: `${inProgress.length} migration(s) started within the last ${MIGRATION_GRACE_MINUTES} minutes and have not finished — a deploy is probably still running. Re-check shortly. First: ${inProgress[0]?.[0]}.`,
          detail: { applied: appliedCount, inProgress: inProgress.length, latest },
        };
      }
      return {
        status: 'ok' as const,
        message: `${appliedCount} migrations applied. Latest: ${latest}.${healedCount > 0 ? ` (${healedCount} were retried after an earlier rollback — resolved.)` : ''}`,
        detail: { applied: appliedCount, retriedAndResolved: healedCount, latest },
      };
    },
  },
  {
    id: 'pgvector-extension',
    group: 'infrastructure',
    label: 'pgvector extension',
    deep: false,
    timeoutMs: 3000,
    timeoutStatus: 'down',
    remediation:
      "The DB image must be pgvector/pgvector:pg16. Run `docker compose exec db psql -U talim -d talim -c 'CREATE EXTENSION IF NOT EXISTS vector;'`. If the version is old, pull the current pg16 image and recreate the db container (the pgdata volume persists your data).",
    run: async () => {
      const rows = await prisma.$queryRaw<{ extversion: string }[]>`
        SELECT extversion FROM pg_extension WHERE extname = 'vector'`;
      const version = rows[0]?.extversion;

      if (!version) {
        return {
          status: 'down' as const,
          message: 'Extension "vector" is not installed — every RAG query will fail with "type vector does not exist".',
        };
      }
      if (isVersionBelow(version, MIN_PGVECTOR)) {
        return {
          status: 'degraded' as const,
          message: `pgvector ${version} is below 0.8.0 — iterative index scan is unavailable, which hurts recall on long documents.`,
          detail: { version },
        };
      }
      return { status: 'ok' as const, message: `pgvector ${version} installed.`, detail: { version } };
    },
  },
  {
    id: 'rag-indexes',
    group: 'infrastructure',
    label: 'HNSW + tsvector indexes',
    deep: false,
    timeoutMs: 3000,
    timeoutStatus: 'degraded',
    remediation:
      'Re-apply the idempotent DDL from apps/api/src/prisma/migrations/20260624010000_rag_hybrid/migration.sql via `docker compose exec db psql -U talim -d talim`, then run `ANALYZE "Chunk";`. Never regenerate this with `prisma migrate diff` — it emits DROP statements for these indexes.',
    run: async () => {
      const [indexes, tsvColumn] = await Promise.all([
        prisma.$queryRaw<{ indexname: string }[]>`
          SELECT indexname FROM pg_indexes
           WHERE tablename IN ('Chunk', 'ContentFigure')
             AND (indexname LIKE '%hnsw%' OR indexname LIKE '%tsv%')`,
        prisma.$queryRaw<{ column_name: string }[]>`
          SELECT column_name FROM information_schema.columns
           WHERE table_name = 'Chunk' AND column_name = 'tsv'`,
      ]);

      const present = new Set(indexes.map((i) => i.indexname));
      const hasChunkHnsw = present.has('Chunk_embedding_hnsw');
      const hasTsvColumn = tsvColumn.length > 0;
      const hasFigureHnsw = present.has('ContentFigure_embedding_hnsw');
      const hasTsvIndex = present.has('Chunk_tsv_gin');

      const detail = {
        Chunk_embedding_hnsw: hasChunkHnsw,
        Chunk_tsv_column: hasTsvColumn,
        Chunk_tsv_gin: hasTsvIndex,
        ContentFigure_embedding_hnsw: hasFigureHnsw,
      };

      // Missing dense index or tsv column breaks retrieval outright — the tutor
      // either times out on a seq scan or errors on the missing column.
      if (!hasChunkHnsw || !hasTsvColumn) {
        const missing = [
          !hasChunkHnsw ? 'Chunk_embedding_hnsw' : null,
          !hasTsvColumn ? 'Chunk.tsv column' : null,
        ].filter(Boolean);
        return {
          status: 'down' as const,
          message: `Retrieval-critical objects missing: ${missing.join(', ')}. The AI tutor will fail or time out.`,
          detail,
        };
      }
      if (!hasFigureHnsw || !hasTsvIndex) {
        const missing = [
          !hasTsvIndex ? 'Chunk_tsv_gin' : null,
          !hasFigureHnsw ? 'ContentFigure_embedding_hnsw' : null,
        ].filter(Boolean);
        return {
          status: 'degraded' as const,
          message: `Secondary index missing: ${missing.join(', ')}. Retrieval still works but keyword/figure arms are slow.`,
          detail,
        };
      }
      return { status: 'ok' as const, message: 'All four RAG indexes present.', detail };
    },
  },
  {
    id: 'redis-connectivity',
    group: 'infrastructure',
    label: 'Redis (job queues)',
    deep: false,
    timeoutMs: 2000,
    timeoutStatus: 'down',
    remediation:
      'Run `docker compose ps redis` and `docker compose up -d --wait redis`, verify REDIS_URL in Doppler, then `docker compose restart api` so Bull re-subscribes cleanly.',
    run: async () => {
      const startedAt = Date.now();
      const pong = await contentQueue.client.ping();
      const elapsed = Date.now() - startedAt;

      if (pong !== 'PONG') {
        return { status: 'down' as const, message: `Unexpected PING reply: ${String(pong)}.` };
      }
      return {
        status: elapsed > SLOW_REDIS_MS ? ('degraded' as const) : ('ok' as const),
        message:
          elapsed > SLOW_REDIS_MS
            ? `Reachable but slow — PING took ${elapsed}ms. Background jobs will lag.`
            : `Reachable (PING ${elapsed}ms).`,
        detail: { pingMs: elapsed },
      };
    },
  },
  {
    id: 'storage-writable',
    group: 'infrastructure',
    label: 'Upload storage writable',
    deep: false,
    timeoutMs: 4000,
    timeoutStatus: 'degraded',
    remediation:
      'On the VPS check `df -h` and `docker system df`; reclaim space with `docker image prune -f`. Verify the uploads volume is mounted read-write: `docker compose exec api touch /uploads/.w && docker compose exec api rm /uploads/.w`.',
    run: async () => {
      // Full round-trip: a read-only mount or a full disk fails at save, and a
      // misconfigured path fails at read — both must be caught before a demo,
      // because rendered podcasts and slides are lost at the very last step.
      const key = await storageService.save(Buffer.from('health-probe'), `health-probe-${Date.now()}.txt`);
      try {
        const readBack = await storageService.get(key);
        if (readBack.toString() !== 'health-probe') {
          return { status: 'down' as const, message: 'Storage round-trip returned different bytes than were written.' };
        }
      } finally {
        await Promise.resolve(storageService.delete(key)).catch(() => undefined);
      }

      let freeMb: number | null = null;
      try {
        const stats = await statfs(env.UPLOAD_DIR);
        const freeBytes = Number(stats.bavail) * Number(stats.bsize);
        freeMb = Math.round(freeBytes / (1024 * 1024));
        if (freeBytes < LOW_DISK_BYTES) {
          return {
            status: 'degraded' as const,
            message: `Writable, but only ${freeMb} MB free on ${env.UPLOAD_DIR}. Large uploads or podcast renders may fail.`,
            detail: { uploadDir: env.UPLOAD_DIR, freeMb },
          };
        }
      } catch {
        // statfs is best-effort (unsupported FS / restricted container) — the
        // write round-trip above already proved the important part.
        freeMb = null;
      }

      return {
        status: 'ok' as const,
        message: `Read/write round-trip succeeded${freeMb === null ? '' : ` · ${freeMb} MB free`}.`,
        detail: { uploadDir: env.UPLOAD_DIR, freeMb },
      };
    },
  },
  {
    id: 'api-process',
    group: 'infrastructure',
    label: 'API process memory & uptime',
    deep: false,
    timeoutMs: 1000,
    timeoutStatus: 'degraded',
    remediation:
      'Lower OCR concurrency (`doppler secrets set OCR_CONCURRENCY=4 -c prd`) or raise the api memory limit in docker-compose.prod.yml, then redeploy. Avoid ingesting large scanned books immediately before a demo.',
    run: async () => {
      const rssMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
      const uptimeSec = Math.round(process.uptime());
      const uptimeLabel =
        uptimeSec < 120 ? `${uptimeSec}s` : `${Math.round(uptimeSec / 60)}m`;

      const limitBytes = await containerMemoryLimitBytes();
      const limitMb = limitBytes === null ? null : Math.round(limitBytes / (1024 * 1024));
      const detail = { rssMb, uptimeSec, limitMb };

      // Only warn when there is a real ceiling to run into. An OOM kill restarts the
      // API and drops every in-flight Bull job — exactly how content ends up stuck.
      if (limitMb !== null && rssMb > limitMb * RSS_WARN_RATIO) {
        return {
          status: 'degraded' as const,
          message: `Memory at ${rssMb} MB of the ${limitMb} MB container limit. An OOM kill would restart the API and drop running jobs. Up ${uptimeLabel}.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `${rssMb} MB resident${limitMb === null ? '' : ` of ${limitMb} MB`} · up ${uptimeLabel}.`,
        detail,
      };
    },
  },
];
