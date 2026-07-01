-- Wave 3 area D: live/scheduled game fields, tutor notes, one-way messaging.
-- Additive only — new columns + two new tables (FK only between the new tables).
-- Does not touch Chunk / pgvector.

ALTER TABLE "TenantAssessment"
    ADD COLUMN "scheduledAt" TIMESTAMP(3),
    ADD COLUMN "isLive" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "liveEndsAt" TIMESTAMP(3);

ALTER TABLE "TenantMembership" ADD COLUMN "tutorNote" TEXT;

CREATE TABLE "TenantMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TenantMessage_tenantId_idx" ON "TenantMessage"("tenantId");
CREATE INDEX "TenantMessage_senderId_idx" ON "TenantMessage"("senderId");

CREATE TABLE "TenantMessageRecipient" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "TenantMessageRecipient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantMessageRecipient_messageId_recipientId_key" ON "TenantMessageRecipient"("messageId", "recipientId");
CREATE INDEX "TenantMessageRecipient_recipientId_idx" ON "TenantMessageRecipient"("recipientId");
ALTER TABLE "TenantMessageRecipient" ADD CONSTRAINT "TenantMessageRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TenantMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
