-- Two-way threaded messaging: group a broadcast + its replies by threadId (null = root).
-- Additive only. Does not touch Chunk / pgvector.
ALTER TABLE "TenantMessage" ADD COLUMN "threadId" TEXT;
CREATE INDEX "TenantMessage_threadId_idx" ON "TenantMessage"("threadId");
