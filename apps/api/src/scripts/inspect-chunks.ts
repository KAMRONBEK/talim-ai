import { prisma } from '../lib/prisma.js';
import { generateEmbedding, embeddingToSql } from '../services/embed.service.js';
import { getOrderedChunks } from '../services/rag.service.js';

const DEFAULT_LIMIT = 7;
const DEFAULT_PREVIEW = 120;

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key?.startsWith('--')) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }
    args[key.slice(2)] = value;
    i += 1;
  }
  return args;
}

function preview(text: string, maxLen: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen)}…`;
}

async function getChunkStats(contentId: string) {
  const rows = await prisma.$queryRawUnsafe<
    { total: bigint; with_embedding: bigint; missing_embedding: bigint }[]
  >(
    `SELECT
       COUNT(*)::bigint AS total,
       COUNT(*) FILTER (WHERE "embedding" IS NOT NULL)::bigint AS with_embedding,
       COUNT(*) FILTER (WHERE "embedding" IS NULL)::bigint AS missing_embedding
     FROM "Chunk"
     WHERE "contentId" = $1`,
    contentId,
  );
  const row = rows[0];
  return {
    total: Number(row?.total ?? 0),
    withEmbedding: Number(row?.with_embedding ?? 0),
    missingEmbedding: Number(row?.missing_embedding ?? 0),
  };
}

async function getEmbeddingStatusByIndex(contentId: string) {
  const rows = await prisma.$queryRawUnsafe<{ chunkIndex: number; has_embedding: boolean }[]>(
    `SELECT "chunkIndex", ("embedding" IS NOT NULL) AS has_embedding
     FROM "Chunk"
     WHERE "contentId" = $1
     ORDER BY "chunkIndex" ASC`,
    contentId,
  );
  return new Map(rows.map((r) => [r.chunkIndex, r.has_embedding]));
}

async function searchWithDistance(
  contentId: string,
  query: string,
  limit: number,
): Promise<{ chunkIndex: number; text: string; distance: number }[]> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorSql = embeddingToSql(queryEmbedding);

  const results = await prisma.$queryRawUnsafe<
    { chunkIndex: number; text: string; distance: number }[]
  >(
    `SELECT "chunkIndex", "text",
            ("embedding" <=> $2::vector) AS distance
     FROM "Chunk"
     WHERE "contentId" = $1 AND "embedding" IS NOT NULL
     ORDER BY distance ASC
     LIMIT $3`,
    contentId,
    vectorSql,
    limit,
  );

  return results.map((r) => ({
    chunkIndex: r.chunkIndex,
    text: r.text,
    distance: Number(r.distance),
  }));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2).filter((arg) => arg !== '--');
  const { contentId, query, limit: limitArg, preview: previewArg } = parseArgs(argv);

  if (!contentId) {
    console.error(
      'Usage: inspect-chunks --contentId <cuid> [--query "question"] [--limit 7] [--preview 120]',
    );
    process.exit(1);
  }

  const limit = limitArg ? Number(limitArg) : DEFAULT_LIMIT;
  const previewLen = previewArg ? Number(previewArg) : DEFAULT_PREVIEW;

  if (!Number.isFinite(limit) || limit < 1) {
    console.error('--limit must be a positive number');
    process.exit(1);
  }
  if (!Number.isFinite(previewLen) || previewLen < 1) {
    console.error('--preview must be a positive number');
    process.exit(1);
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true, title: true, status: true },
  });

  if (!content) {
    console.error(`Content not found: ${contentId}`);
    process.exit(1);
  }

  const stats = await getChunkStats(contentId);

  console.log('--- Content ---');
  console.log(`id:     ${content.id}`);
  console.log(`title:  ${content.title}`);
  console.log(`status: ${content.status}`);
  console.log('');
  console.log('--- Chunk stats ---');
  console.log(`total:      ${stats.total}`);
  console.log(`embedded:   ${stats.withEmbedding}`);
  console.log(`missing:    ${stats.missingEmbedding}`);

  if (stats.total === 0) {
    console.log('\nNo chunks for this content. Ingestion may still be running or failed.');
    return;
  }
  if (stats.missingEmbedding > 0) {
    console.log('\nWarning: some chunks are missing embeddings — RAG search will skip them.');
  }

  const embeddingStatus = await getEmbeddingStatusByIndex(contentId);
  const chunks = await getOrderedChunks(contentId, stats.total);

  console.log('\n--- Chunks (document order) ---');
  for (const chunk of chunks) {
    const embedded = embeddingStatus.get(chunk.chunkIndex) ? 'yes' : 'no';
    console.log(`[${chunk.chunkIndex}] embedded=${embedded}`);
    console.log(`  ${preview(chunk.text, previewLen)}`);
  }

  if (!query) return;

  if (stats.withEmbedding === 0) {
    console.log('\nSkipping similarity search: no embedded chunks.');
    return;
  }

  console.log('\n--- Similarity search ---');
  console.log(`query: ${query}`);
  console.log(`limit: ${limit}`);

  const hits = await searchWithDistance(contentId, query, limit);
  for (const hit of hits) {
    console.log(`[${hit.chunkIndex}] distance=${hit.distance.toFixed(4)}`);
    console.log(`  ${preview(hit.text, previewLen)}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
