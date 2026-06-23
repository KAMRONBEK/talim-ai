-- CreateEnum
CREATE TYPE "TutorRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: User identity + first-login password change
ALTER TABLE "User" ADD COLUMN     "username" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Tenant join code + custom seat limit
ALTER TABLE "Tenant" ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "seatLimit" INTEGER;

-- CreateTable
CREATE TABLE "TutorRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "note" TEXT,
    "status" "TutorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_joinCode_key" ON "Tenant"("joinCode");

-- CreateIndex
CREATE INDEX "TutorRequest_userId_idx" ON "TutorRequest"("userId");

-- CreateIndex
CREATE INDEX "TutorRequest_status_idx" ON "TutorRequest"("status");

-- AddForeignKey
ALTER TABLE "TutorRequest" ADD CONSTRAINT "TutorRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
