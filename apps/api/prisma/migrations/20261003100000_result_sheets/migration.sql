-- CreateEnum
CREATE TYPE "ResultSheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "result_sheets" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "status" "ResultSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unlockReason" TEXT,
    "frozen" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "result_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "result_sheets_termId_classArmId_subjectId_key" ON "result_sheets"("termId", "classArmId", "subjectId");

-- CreateIndex
CREATE INDEX "result_sheets_schoolId_termId_idx" ON "result_sheets"("schoolId", "termId");
