-- An admission number is the student's identifier from registration to
-- graduation: printed on files, report cards and receipts, and used to look
-- them up. Once issued it must never change. This is enforced in the database
-- so it holds for every code path, including ones not written yet and manual
-- SQL run against production. Correcting a mistaken number is deliberately
-- hard: it means dropping this trigger on purpose, which is visible.
CREATE OR REPLACE FUNCTION "prevent_admission_no_change"() RETURNS trigger AS $$
BEGIN
    IF NEW."admissionNo" IS DISTINCT FROM OLD."admissionNo" THEN
        RAISE EXCEPTION 'Admission number % cannot be changed once issued', OLD."admissionNo";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "students_admission_no_immutable"
    BEFORE UPDATE ON "students"
    FOR EACH ROW EXECUTE FUNCTION "prevent_admission_no_change"();
