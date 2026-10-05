-- CreateTable
CREATE TABLE "student_remarks" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "formComment" TEXT,
    "principalComment" TEXT,
    "traits" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "frozen" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_remarks_termId_studentId_key" ON "student_remarks"("termId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_termId_studentId_key" ON "report_cards"("termId", "studentId");

-- CreateIndex
CREATE INDEX "report_cards_schoolId_studentId_idx" ON "report_cards"("schoolId", "studentId");
