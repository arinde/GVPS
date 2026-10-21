-- CreateEnum
CREATE TYPE "TeachingResourceType" AS ENUM ('SCHEME_OF_WORK', 'LECTURE_NOTE', 'EXAM_QUESTIONS');

-- CreateEnum
CREATE TYPE "TeachingResourceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- CreateTable
CREATE TABLE "teaching_resources" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" "TeachingResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classLevelId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "status" "TeachingResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teaching_resources_schoolId_type_subjectId_classLevelId_te_idx" ON "teaching_resources"("schoolId", "type", "subjectId", "classLevelId", "termId");
