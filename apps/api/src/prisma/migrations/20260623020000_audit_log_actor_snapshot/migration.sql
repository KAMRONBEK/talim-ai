-- Preserve the audit trail when an admin account is deleted: decouple the row
-- from the actor's lifecycle (SetNull instead of Cascade) and snapshot the
-- actor's identity at write time.

-- DropForeignKey
ALTER TABLE "AdminAuditLog" DROP CONSTRAINT "AdminAuditLog_adminUserId_fkey";

-- AlterTable
ALTER TABLE "AdminAuditLog"
  ALTER COLUMN "adminUserId" DROP NOT NULL,
  ADD COLUMN "adminEmail" TEXT,
  ADD COLUMN "adminName" TEXT;

-- Backfill the snapshot columns for existing rows from the current actor.
UPDATE "AdminAuditLog" AS a
SET "adminEmail" = u."email", "adminName" = u."name"
FROM "User" AS u
WHERE a."adminUserId" = u."id";

-- AddForeignKey
ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
