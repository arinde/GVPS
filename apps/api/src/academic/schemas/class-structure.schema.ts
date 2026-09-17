import { z } from "zod";
import { Section, Stream } from "@prisma/client";

// FEATURES.md §2.2. `rank` is the promotion order (Primary 1 = 1 … SSS 3 = 12)
// so "the next level up" is arithmetic rather than parsing a level name.
export const CreateClassLevelSchema = z.object({
  section: z.enum(Section),
  name: z.string().trim().min(1).max(40),
  rank: z.int().min(1).max(20),
});

// A stream belongs only to a senior arm. The database enforces this with a
// trigger as well — this check is here so the caller gets a 400 with a useful
// message instead of a 500 from a raised Postgres exception.
export const CreateClassArmSchema = z.object({
  name: z.string().trim().min(1).max(20),
  capacity: z.int().min(1).max(200).optional(),
  stream: z.enum(Stream).optional(),
});

export type CreateClassLevelDto = z.infer<typeof CreateClassLevelSchema>;
export type CreateClassArmDto = z.infer<typeof CreateClassArmSchema>;
