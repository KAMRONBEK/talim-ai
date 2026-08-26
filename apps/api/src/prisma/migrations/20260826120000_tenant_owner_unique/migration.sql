-- One owner owns exactly one org. Every consumer already assumed this
-- (resolveTenantIdForUser, getTenantForOwner, regenerateJoinCode, patchTenantForOwner,
-- adminUserRole) but nothing enforced it, so a concurrent tutor approval could create a
-- second Tenant for the same owner and the tutor's students, materials and join code
-- would split between them depending on which row findFirst happened to return.
--
-- Hand-written rather than generated: `prisma migrate diff` emits DROP statements for the
-- pgvector HNSW indexes and Chunk.tsv on this schema.
DROP INDEX IF EXISTS "Tenant_ownerId_idx";
CREATE UNIQUE INDEX "Tenant_ownerId_key" ON "Tenant"("ownerId");
