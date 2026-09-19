import { z } from "zod";
import { GuardianRelationship, Sex, Stream } from "@prisma/client";
import { blankAsUndefined } from "@/common/schemas/blank-as-undefined";
import { PhoneSchema } from "@/common/schemas/phone.schema";
import { isKnownState, isLgaOfState } from "@/reference/nigeria-states";

// The eight ABO/Rh groups. Stored as text because "A+" is not a valid enum
// identifier; this list is what keeps it from being free-typed.
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const Name = z.string().trim().min(1).max(80);
export const OptionalText = blankAsUndefined(z.string().trim().max(200));

export const GuardianInputSchema = z.object({
  firstName: Name,
  lastName: Name,
  phone: PhoneSchema,
  altPhone: PhoneSchema.optional(),
  email: blankAsUndefined(z.email()),
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

    // The year sets the admission number's {YEAR}; the exact day is optional
    // because older records often have only the year.
    admissionYear: z.int("Choose the year of admission").min(1950, "Choose the year of admission"),
    dateOfAdmission: blankAsUndefined(z.iso.date()),
    // The arm the student joins now. Their level is derived from it, so the
    // two can never disagree.
    classArmId: z.string().min(1),
    // Department, for senior (SSS) arms only. Whether it is required or
    // forbidden depends on the arm, which only the service can look up.
    stream: z.enum(Stream).optional(),

    address: OptionalText,
    bloodGroup: blankAsUndefined(z.enum(BLOOD_GROUPS, "Choose a blood group from the list")),
    medicalNote: blankAsUndefined(z.string().trim().max(500)),
    previousSchool: OptionalText,

    // At least one guardian is required. This is the school's decision and
    // tightens FEATURES.md §3.5, which leans towards never blocking entry: a
    // student with no contact on file is a child the office cannot reach.
    guardians: z.array(GuardianInputSchema).min(1, "Add at least one parent or guardian").max(4),
  })
  .refine((student) => student.admissionYear <= new Date().getFullYear(), {
    message: "The year of admission cannot be in the future",
    path: ["admissionYear"],
  })
  .refine(
    (student) => !student.dateOfAdmission || Number(student.dateOfAdmission.slice(0, 4)) === student.admissionYear,
    {
      message: "The date must fall in the year of admission",
      path: ["dateOfAdmission"],
    },
  )
  .refine(
    (student) =>
      student.dateOfAdmission
        ? new Date(student.dateOfBirth) < new Date(student.dateOfAdmission)
        : Number(student.dateOfBirth.slice(0, 4)) <= student.admissionYear,
    { message: "A student cannot be admitted before they were born", path: ["dateOfBirth"] },
  )
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
