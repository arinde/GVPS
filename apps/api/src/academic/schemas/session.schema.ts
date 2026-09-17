import { z } from "zod";

// Dates cross the wire as ISO strings and become Date only at the edges
// (AGENTS.md §8). z.iso.date() accepts "2026-09-01", not a full timestamp —
// a term boundary is a school day, not an instant.
const IsoDate = z.iso.date();

// FEATURES.md §2.1: three terms per session, each carrying the number of
// times the school opened, which is printed on every report card. That figure
// is not known until the term has run, so it is optional at creation.
export const TermInputSchema = z
  .object({
    sequence: z.int().min(1).max(3),
    name: z.string().trim().min(1).max(60),
    startDate: IsoDate,
    endDate: IsoDate,
    timesSchoolOpened: z.int().min(0).max(300).optional(),
  })
  .refine((term) => term.endDate > term.startDate, {
    message: "A term must end after it starts",
    path: ["endDate"],
  });

export const CreateSessionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^\d{4}\/\d{4}$/, "Session name must look like 2026/2027"),
    startDate: IsoDate,
    endDate: IsoDate,
    // Supplying terms here is how rollover works: the next session and its
    // three terms are created in one transaction, so a session can never
    // exist in a half-built state (FEATURES.md §2.1).
    terms: z.array(TermInputSchema).max(3).optional(),
  })
  .refine((session) => session.endDate > session.startDate, {
    message: "A session must end after it starts",
    path: ["endDate"],
  })
  .refine((session) => new Set(session.terms?.map((t) => t.sequence)).size === (session.terms?.length ?? 0), {
    message: "Term sequences must be unique within a session",
    path: ["terms"],
  });

export const UpdateTermSchema = z.object({
  timesSchoolOpened: z.int().min(0).max(300),
});

export type TermInputDto = z.infer<typeof TermInputSchema>;
export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateTermDto = z.infer<typeof UpdateTermSchema>;
