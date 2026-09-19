CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subject_offerings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classLevelId" TEXT NOT NULL,
    "stream" "Stream",
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "passMark" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subject_offerings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subject_assignments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subject_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subjects_schoolId_name_key" ON "subjects"("schoolId", "name");
CREATE UNIQUE INDEX "subjects_schoolId_code_key" ON "subjects"("schoolId", "code");
CREATE INDEX "subject_offerings_schoolId_classLevelId_idx" ON "subject_offerings"("schoolId", "classLevelId");
-- Hand-written: one offering per subject × level × stream, where "no stream"
-- counts as a value. A plain unique index would let two null-stream rows in.
CREATE UNIQUE INDEX "subject_offerings_subject_level_stream_key"
  ON "subject_offerings"("subjectId", "classLevelId", "stream") NULLS NOT DISTINCT;
CREATE UNIQUE INDEX "subject_assignments_sessionId_subjectId_classArmId_key"
  ON "subject_assignments"("sessionId", "subjectId", "classArmId");
CREATE INDEX "subject_assignments_schoolId_sessionId_staffId_idx"
  ON "subject_assignments"("schoolId", "sessionId", "staffId");

ALTER TABLE "subject_offerings" ADD CONSTRAINT "subject_offerings_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_offerings" ADD CONSTRAINT "subject_offerings_classLevelId_fkey"
  FOREIGN KEY ("classLevelId") REFERENCES "class_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_classArmId_fkey"
  FOREIGN KEY ("classArmId") REFERENCES "class_arms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
