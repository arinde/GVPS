import { z } from "zod";

// null clears the class's teacher; a staff id sets it.
export const SetClassTeacherSchema = z.object({
  staffId: z.string().min(1).nullable(),
});

export type SetClassTeacherDto = z.infer<typeof SetClassTeacherSchema>;
