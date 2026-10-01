-- DropIndex
DROP INDEX "subject_offerings_subject_level_stream_key";

-- CreateTable
CREATE TABLE "assessment_components" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "name" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scales" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "passMark" INTEGER NOT NULL,
    "promotionThreshold" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_bands" (
    "id" TEXT NOT NULL,
    "gradingScaleId" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "descriptor" TEXT NOT NULL,
    "remark" TEXT NOT NULL,

    CONSTRAINT "grade_bands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_components_schoolId_termId_section_idx" ON "assessment_components"("schoolId", "termId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_components_termId_section_name_key" ON "assessment_components"("termId", "section", "name");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scales_schoolId_section_key" ON "grading_scales"("schoolId", "section");

-- AddForeignKey
ALTER TABLE "grade_bands" ADD CONSTRAINT "grade_bands_gradingScaleId_fkey" FOREIGN KEY ("gradingScaleId") REFERENCES "grading_scales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
