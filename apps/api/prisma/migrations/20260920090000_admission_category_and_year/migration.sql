-- Admission numbers carry a category code ({CODE}): nursery, primary or
-- secondary, each with its own running count. Numbers already issued are
-- permanent (see admission_no_immutable) and keep their old shape.
ALTER TYPE "Section" ADD VALUE 'NURSERY' BEFORE 'PRIMARY';

ALTER TABLE "schools"
  ADD COLUMN "admissionCodeNursery" TEXT NOT NULL DEFAULT 'NUR',
  ADD COLUMN "admissionCodePrimary" TEXT NOT NULL DEFAULT 'PRY',
  ADD COLUMN "admissionCodeSecondary" TEXT NOT NULL DEFAULT 'SEC',
  ALTER COLUMN "admissionNoFormat" SET DEFAULT '{PREFIX}/{CODE}/{YEAR}/{SEQ}';

-- Schools still on the original default move to the coded format; a school
-- that chose its own format keeps it.
UPDATE "schools" SET "admissionNoFormat" = '{PREFIX}/{CODE}/{YEAR}/{SEQ}'
  WHERE "admissionNoFormat" = '{PREFIX}/{YEAR}/{SEQ}';

-- Existing counters belong to the uncoded format, so they keep code ''.
ALTER TABLE "admission_counters" ADD COLUMN "code" TEXT NOT NULL DEFAULT '';
DROP INDEX "admission_counters_schoolId_year_key";
CREATE UNIQUE INDEX "admission_counters_schoolId_code_year_key" ON "admission_counters"("schoolId", "code", "year");

-- The admission year becomes required and the exact date optional.
ALTER TABLE "students" ADD COLUMN "admissionYear" INTEGER;
UPDATE "students" SET "admissionYear" = EXTRACT(YEAR FROM "dateOfAdmission")::INTEGER;
ALTER TABLE "students" ALTER COLUMN "admissionYear" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "dateOfAdmission" DROP NOT NULL;
