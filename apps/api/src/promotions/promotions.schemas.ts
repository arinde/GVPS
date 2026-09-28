import { z } from "zod";
import { EnrolmentStatus, Stream } from "@prisma/client";

const Id = z.string().min(1);

/**
 * Moving a class into the next session. Repeating a year is the same action
 * with the same level chosen as the destination, so it needs no separate path.
 */
export const PromoteSchema = z.object({
  fromClassArmId: Id,
  toSessionId: Id,
  toClassArmId: Id,
  // Senior destinations only: the department each promoted student joins.
  stream: z.enum(Stream).optional(),
  studentIds: z.array(Id).min(1, "Choose at least one student"),
});

/** Moving a student between classes inside the session they are already in. */
export const TransferSchema = z.object({
  classArmId: Id,
  stream: z.enum(Stream).optional(),
  reason: z.string().trim().max(200).optional(),
});

// Leaving: which way, when, and why. ACTIVE is not offered — a student who is
// still here has not left, and "undo" is a transfer, not an exit.
const EXIT_STATUSES = [EnrolmentStatus.TRANSFERRED, EnrolmentStatus.WITHDRAWN, EnrolmentStatus.GRADUATED] as const;

export const ExitSchema = z.object({
  status: z.enum(EXIT_STATUSES, "Choose how the student left"),
  exitedOn: z.iso.date(),
  reason: z.string().trim().max(200).optional(),
});

export type PromoteDto = z.infer<typeof PromoteSchema>;
export type TransferDto = z.infer<typeof TransferSchema>;
export type ExitDto = z.infer<typeof ExitSchema>;
