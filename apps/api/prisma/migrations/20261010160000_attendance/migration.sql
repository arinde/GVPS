-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classArmId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "periodId" TEXT,
    "subjectId" TEXT,
    "markedByStaffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- A plain unique index treats two NULL periodIds as distinct, which would
-- let daily marking (periodId null) double up for the same student/day.
CREATE UNIQUE INDEX "attendance_records_classArmId_studentId_date_periodId_key"
  ON "attendance_records"("classArmId", "studentId", "date", "periodId") NULLS NOT DISTINCT;

CREATE INDEX "attendance_records_schoolId_termId_studentId_idx" ON "attendance_records"("schoolId", "termId", "studentId");
CREATE INDEX "attendance_records_schoolId_classArmId_date_idx" ON "attendance_records"("schoolId", "classArmId", "date");
