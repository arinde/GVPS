import { z } from "zod";
import { Stream } from "@prisma/client";

const Id = z.string().min(1);

export const SubjectSchema = z.object({
  name: z.string().trim().min(1, "Enter the subject's name").max(60),
  // Short and upper-case, for broadsheets and report cards: "MTH", "ENG".
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,8}$/, "Use 2 to 8 letters or digits, e.g. MTH"),
});

/** Offer one subject at several levels in one go — "Mathematics at Primary 1–6". */
export const AddOfferingsSchema = z.object({
  classLevelIds: z.array(Id).min(1, "Choose at least one class level"),
  // Senior levels only; none means every department takes it.
  stream: z.enum(Stream).optional(),
  isCore: z.boolean().default(true),
});

export const UpdateOfferingSchema = z.object({
  isCore: z.boolean(),
  passMark: z.int().min(0).max(100).nullable(),
});

/** A subject teacher takes one subject in several classes. */
export const AssignSubjectSchema = z.object({
  staffId: Id,
  subjectId: Id,
  classArmIds: z.array(Id).min(1, "Choose at least one class"),
});

/** FEATURES.md §2.4's primary model: every subject offered to one class, to one teacher. */
export const AssignClassSubjectsSchema = z.object({
  staffId: Id,
  classArmId: Id,
});

export type SubjectDto = z.infer<typeof SubjectSchema>;
export type AddOfferingsDto = z.infer<typeof AddOfferingsSchema>;
export type UpdateOfferingDto = z.infer<typeof UpdateOfferingSchema>;
export type AssignSubjectDto = z.infer<typeof AssignSubjectSchema>;
export type AssignClassSubjectsDto = z.infer<typeof AssignClassSubjectsSchema>;
