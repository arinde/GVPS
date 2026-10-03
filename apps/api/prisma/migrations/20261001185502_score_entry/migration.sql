-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "assessmentComponentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scores_schoolId_termId_subjectId_classArmId_idx" ON "scores"("schoolId", "termId", "subjectId", "classArmId");

-- CreateIndex
CREATE UNIQUE INDEX "scores_termId_studentId_subjectId_assessmentComponentId_key" ON "scores"("termId", "studentId", "subjectId", "assessmentComponentId");
