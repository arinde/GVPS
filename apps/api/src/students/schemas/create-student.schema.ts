import { z } from "zod";
import { GuardianRelationship, Sex, Stream } from "@prisma/client";
import { PhoneSchema } from "@/common/schemas/phone.schema";
import { isKnownState, isLgaOfState } from "@/reference/nigeria-states";

// The eight ABO/Rh groups. Stored as text because "A+" is not a valid enum
// identifier; this list is what keeps it from being free-typed.
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const Name = z.string().trim().min(1).max(80);
const OptionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal("").transform(() => undefined));

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
    // Department, for senior (SSS) arms only. Whether it is required or
    // forbidden depends on the arm, which only the service can look up.
    stream: z.enum(Stream).optional(),

    address: OptionalText,
    bloodGroup: z
      .enum(BLOOD_GROUPS, "Choose a blood group from the list")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    medicalNote: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    previousSchool: OptionalText,

    // At least one guardian is required. This is the school's decision and
    // tightens FEATURES.md §3.5, which leans towards never blocking entry: a
    // student with no contact on file is a child the office cannot reach.
    guardians: z.array(GuardianInputSchema).min(1, "Add at least one parent or guardian").max(4),
  })
  .refine((student) => new Date(student.dateOfBirth) < new Date(student.dateOfAdmission), {
    message: "A student cannot be admitted before they were born",
    path: ["dateOfBirth"],
  })
  .refine((student) => student.guardians.filter((g) => g.isPrimary).length <= 1, {
    message: "Only one guardian can be the primary contact",
    path: ["guardians"],
  })
  .refine((student) => !student.stateOfOrigin || isKnownState(student.stateOfOrigin), {
    message: "Choose a state from the list",
    path: ["stateOfOrigin"],
  })
  .refine((student) => !student.lga || Boolean(student.stateOfOrigin), {
    message: "Choose the state first",
    path: ["lga"],
  })
  // The LGA must belong to the chosen state. Without this, changing the state
  // after picking an LGA would save a Kano student in a Lagos LGA.
  .refine((student) => !student.lga || !student.stateOfOrigin || isLgaOfState(student.stateOfOrigin, student.lga), {
    message: "That LGA is not in the chosen state",
    path: ["lga"],
  });

export type GuardianInputDto = z.infer<typeof GuardianInputSchema>;
export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
