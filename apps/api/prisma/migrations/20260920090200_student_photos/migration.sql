CREATE TABLE "student_photos" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_photos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_photos_studentId_key" ON "student_photos"("studentId");

ALTER TABLE "student_photos" ADD CONSTRAINT "student_photos_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
