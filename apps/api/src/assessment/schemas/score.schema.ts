import { z } from "zod";

// One grid cell: a student's mark for one component of one subject. Scoped by
// path params (termId, subjectId, classArmId) at the controller, not in the
// body, so a client cannot save a score into a class it didn't ask to open.
export const UpsertScoreSchema = z.object({
  studentId: z.string().trim().min(1),
  assessmentComponentId: z.string().trim().min(1),
  value: z.int().min(0),
});

export type UpsertScoreDto = z.infer<typeof UpsertScoreSchema>;

// A full row or a full grid saved at once — each cell is still applied
// independently server-side, so one bad cell doesn't fail the rest. That is
// what lets an offline sync queue retry only what actually failed.
export const SaveScoreBatchSchema = z.object({
  scores: z.array(UpsertScoreSchema).min(1),
});

export type SaveScoreBatchDto = z.infer<typeof SaveScoreBatchSchema>;
