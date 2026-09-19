import { z } from "zod";
import { Section, Stream } from "@prisma/client";

// FEATURES.md §2.2. `rank` is the promotion order (Creche = 1 … SSS 3 = 17)
// so "the next level up" is arithmetic rather than parsing a level name.
export const CreateClassLevelSchema = z.object({
  section: z.enum(Section),
  name: z.string().trim().min(1).max(40),
  rank: z.int().min(1).max(20),
});

// A stream belongs only to a senior arm. The database enforces this with a
// trigger as well — this check is here so the caller gets a 400 with a useful
// message instead of a 500 from a raised Postgres exception.
// Arm names are stored upper-case so "b" and "B" cannot both exist and every
// label reads "Primary 4B".
export const CreateClassArmSchema = z.object({
  name: z.string().trim().min(1).max(20).toUpperCase(),
  capacity: z.int().min(1).max(200).optional(),
  stream: z.enum(Stream).optional(),
});

// Class size only. The name is fixed once students are enrolled under it, and
// null clears a size that no longer applies.
export const UpdateClassArmSchema = z.object({
  capacity: z.int().min(1).max(200).nullable(),
});

export type CreateClassLevelDto = z.infer<typeof CreateClassLevelSchema>;
export type CreateClassArmDto = z.infer<typeof CreateClassArmSchema>;
export type UpdateClassArmDto = z.infer<typeof UpdateClassArmSchema>;
