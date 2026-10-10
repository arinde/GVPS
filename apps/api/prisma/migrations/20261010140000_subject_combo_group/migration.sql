-- Senior elective combo group — subjects sharing one are forced onto the
-- same period across whichever arms teach them (owner's own combo list).
ALTER TABLE "subjects" ADD COLUMN "comboGroup" TEXT;
