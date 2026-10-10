-- An elective combo (Accounting/Chemistry/Government, and the owner's other
-- named groups) puts more than one subject in the same (classArm, day,
-- period) slot on purpose, since different students split into different
-- combo rooms at the same time. Loosen the old 3-column unique constraint
-- to include subjectId, so a slot can hold one row per combo member while
-- still refusing a duplicate row for the same subject in the same slot.
DROP INDEX "timetable_slots_classArmId_dayOfWeek_periodId_key";

CREATE UNIQUE INDEX "timetable_slots_classArmId_dayOfWeek_periodId_subjectId_key" ON "timetable_slots"("classArmId", "dayOfWeek", "periodId", "subjectId");

CREATE INDEX "timetable_slots_classArmId_dayOfWeek_periodId_idx" ON "timetable_slots"("classArmId", "dayOfWeek", "periodId");
