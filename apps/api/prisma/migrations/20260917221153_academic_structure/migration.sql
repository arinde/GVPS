-- CreateEnum
CREATE TYPE "Section" AS ENUM ('PRIMARY', 'JUNIOR', 'SENIOR');

-- CreateEnum
CREATE TYPE "Stream" AS ENUM ('SCIENCE', 'ARTS', 'COMMERCIAL');

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timesSchoolOpened" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_levels" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_arms" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classLevelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "stream" "Stream",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_arms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_schoolId_name_key" ON "academic_sessions"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "terms_sessionId_sequence_key" ON "terms"("sessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "class_levels_schoolId_name_key" ON "class_levels"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "class_levels_schoolId_rank_key" ON "class_levels"("schoolId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "class_arms_classLevelId_name_key" ON "class_arms"("classLevelId", "name");

-- AddForeignKey
ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_levels" ADD CONSTRAINT "class_levels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_arms" ADD CONSTRAINT "class_arms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_arms" ADD CONSTRAINT "class_arms_classLevelId_fkey" FOREIGN KEY ("classLevelId") REFERENCES "class_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FEATURES.md §2.1: "Exactly one session and one term marked current."
-- Partial unique indexes, so the database refuses a second current row rather
-- than trusting every future code path to remember. Prisma's schema language
-- cannot express a WHERE clause on an index, so these are written by hand and
-- are the reason this migration was created with --create-only.
CREATE UNIQUE INDEX "academic_sessions_one_current_per_school"
    ON "academic_sessions" ("schoolId")
    WHERE "isCurrent";

-- Scoped per school, not per session: the current term is a school-wide fact.
-- A second current term anywhere in the school is the bug this prevents.
CREATE UNIQUE INDEX "terms_one_current_per_school"
    ON "terms" ("schoolId")
    WHERE "isCurrent";

-- A stream only means anything for senior arms (FEATURES.md §2.2). Without
-- this, a primary arm could be tagged "Science" and subject offerings would
-- silently resolve wrongly. A CHECK constraint cannot do this in Postgres --
-- CHECK forbids subqueries -- so it is a trigger.
CREATE OR REPLACE FUNCTION "assert_stream_is_senior_only"() RETURNS trigger AS $$
BEGIN
    IF NEW."stream" IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM "class_levels"
        WHERE "class_levels"."id" = NEW."classLevelId"
          AND "class_levels"."section" = 'SENIOR'
    ) THEN
        RAISE EXCEPTION 'A stream can only be set on a SENIOR class arm';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "class_arms_stream_senior_only"
    BEFORE INSERT OR UPDATE ON "class_arms"
    FOR EACH ROW EXECUTE FUNCTION "assert_stream_is_senior_only"();
