CREATE TABLE "admission_number_history" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "retiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admission_number_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admission_number_history_schoolId_admissionNo_key"
  ON "admission_number_history"("schoolId", "admissionNo");
CREATE INDEX "admission_number_history_studentId_idx" ON "admission_number_history"("studentId");

ALTER TABLE "admission_number_history" ADD CONSTRAINT "admission_number_history_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The number stays immutable everywhere except one deliberate path: promotion
-- into secondary, which sets this flag inside its transaction and archives the
-- old number in the same breath. Every other code path — and hand-run SQL —
-- still cannot change a number, which is the point of the trigger.
CREATE OR REPLACE FUNCTION "prevent_admission_no_change"() RETURNS trigger AS $$
BEGIN
    IF NEW."admissionNo" IS DISTINCT FROM OLD."admissionNo"
       AND coalesce(current_setting('gvps.reissue_admission_no', true), 'off') <> 'on' THEN
        RAISE EXCEPTION 'Admission number % cannot be changed once issued', OLD."admissionNo";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
