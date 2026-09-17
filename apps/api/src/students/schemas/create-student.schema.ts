import { z } from "zod";
import { GuardianRelationship, Sex } from "@prisma/client";

const Name = z.string().trim().min(1).max(80);
const OptionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal("").transform(() => undefined));

// Nigerian numbers, entered however the parent writes them: 08012345678,
// +2348012345678, or with spaces. Normalised to +234XXXXXXXXXX so the same
// parent is recognised as the same person across their children
// (PLAN.md §4.6 — guardians are shared entities, not per-student fields).
export const PhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^(\+?234|0)\d{10}$/.test(value), "Enter a valid Nigerian phone number")
  .transform((value) =>
    value.startsWith("0") ? `+234${value.slice(1)}` : value.startsWith("+") ? value : `+${value}`,
  );

export const GuardianInputSchema = z.object({
  firstName: Name,
  lastName: Name,
  phone: PhoneSchema,
  altPhone: PhoneSchema.optional(),
  email: z
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  address: OptionalText,
  occupation: OptionalText,
  relationship: z.enum(GuardianRelationship),
  isPrimary: z.boolean().default(false),
});

export const CreateStudentSchema = z
  .object({
    firstName: Name,
    lastName: Name,
    otherNames: OptionalText,
    dateOfBirth: z.iso.date(),
    sex: z.enum(Sex),
    nationality: z.string().trim().max(60).default("Nigerian"),
    stateOfOrigin: OptionalText,
    lga: OptionalText,

    dateOfAdmission: z.iso.date(),
    // The arm the student joins now. Their level is derived from it, so the
    // two can never disagree.
    classArmId: z.string().min(1),

    address: OptionalText,
    bloodGroup: z
      .string()
      .trim()
      .max(5)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    medicalNote: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    previousSchool: OptionalText,

    // A student can be entered with no guardian and have one added later —
    // FEATURES.md §3.5 is emphatic that nothing should block entry.
    guardians: z.array(GuardianInputSchema).max(4).default([]),
  })
  .refine((student) => new Date(student.dateOfBirth) < new Date(student.dateOfAdmission), {
    message: "A student cannot be admitted before they were born",
    path: ["dateOfBirth"],
  })
  .refine((student) => student.guardians.filter((g) => g.isPrimary).length <= 1, {
    message: "Only one guardian can be the primary contact",
    path: ["guardians"],
  });

export type GuardianInputDto = z.infer<typeof GuardianInputSchema>;
export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
