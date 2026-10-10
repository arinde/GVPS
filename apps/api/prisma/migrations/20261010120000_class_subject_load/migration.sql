-- A class's subject list now lives apart from who teaches each subject, so a
-- subject (and its periods-per-week / fixed day) can be added before a
-- teacher exists, and survives a teacher being unassigned or swapped.

-- CreateTable
CREATE TABLE "class_subject_loads" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "periodsPerWeek" INTEGER NOT NULL DEFAULT 1,
    "fixedDay" "DayOfWeek",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_subject_loads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "class_subject_loads_sessionId_subjectId_classArmId_key" ON "class_subject_loads"("sessionId", "subjectId", "classArmId");

ALTER TABLE "class_subject_loads" ADD CONSTRAINT "class_subject_loads_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_subject_loads" ADD CONSTRAINT "class_subject_loads_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_subject_loads" ADD CONSTRAINT "class_subject_loads_classArmId_fkey" FOREIGN KEY ("classArmId") REFERENCES "class_arms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry forward any load already set through a teacher assignment.
INSERT INTO "class_subject_loads" ("id", "schoolId", "sessionId", "subjectId", "classArmId", "periodsPerWeek", "fixedDay", "createdAt")
SELECT 'csl_' || md5(sa."id"), sa."schoolId", sa."sessionId", sa."subjectId", sa."classArmId", sa."periodsPerWeek", sa."fixedDay", now()
FROM "subject_assignments" sa
ON CONFLICT DO NOTHING;

-- DropColumn
ALTER TABLE "subject_assignments" DROP COLUMN "periodsPerWeek";
ALTER TABLE "subject_assignments" DROP COLUMN "fixedDay";
