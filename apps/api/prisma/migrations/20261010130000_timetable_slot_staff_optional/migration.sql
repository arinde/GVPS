-- A lesson is placed as soon as the class's subject list says it needs the
-- time, even before a teacher exists for it — the owner wants the draft
-- timetable generated regardless, filled in once staffing catches up.
ALTER TABLE "timetable_slots" ALTER COLUMN "staffId" DROP NOT NULL;
