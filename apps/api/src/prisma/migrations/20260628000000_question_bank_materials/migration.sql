-- CreateTable
CREATE TABLE "QuestionBankContent" (
    "bankId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionBankContent_pkey" PRIMARY KEY ("bankId","contentId")
);

-- CreateIndex
CREATE INDEX "QuestionBankContent_contentId_idx" ON "QuestionBankContent"("contentId");

-- AddForeignKey
ALTER TABLE "QuestionBankContent" ADD CONSTRAINT "QuestionBankContent_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankContent" ADD CONSTRAINT "QuestionBankContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
