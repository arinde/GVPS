import { z } from "zod";
import { Sex } from "@prisma/client";
import { blankAsUndefined } from "@/common/schemas/blank-as-undefined";
import { PhoneSchema } from "@/common/schemas/phone.schema";
import { isKnownState, isLgaOfState } from "@/reference/nigeria-states";
import { BLOOD_GROUPS, Name, OptionalText } from "@/students/schemas/create-student.schema";

// Correcting a student's details. Not editable here, on purpose: the
// admission number and its year (permanent, by trigger), the class (that is
// a transfer, with its own history), and guardians (edited one by one, since
// a guardian is shared between siblings). The service checks that the date
// falls in the admission year, which it has to read from the record.
export const UpdateStudentSchema = z
  .object({
    firstName: Name,
    lastName: Name,
    otherNames: OptionalText,
    dateOfBirth: z.iso.date(),
    sex: z.enum(Sex),
    stateOfOrigin: OptionalText,
    lga: OptionalText,
    dateOfAdmission: blankAsUndefined(z.iso.date()),
    address: OptionalText,
    bloodGroup: blankAsUndefined(z.enum(BLOOD_GROUPS, "Choose a blood group from the list")),
    medicalNote: blankAsUndefined(z.string().trim().max(500)),
    previousSchool: OptionalText,
  })
  .refine((student) => !student.stateOfOrigin || isKnownState(student.stateOfOrigin), {
    message: "Choose a state from the list",
    path: ["stateOfOrigin"],
  })
  .refine((student) => !student.lga || Boolean(student.stateOfOrigin), {
    message: "Choose the state first",
    path: ["lga"],
  })
  .refine((student) => !student.lga || !student.stateOfOrigin || isLgaOfState(student.stateOfOrigin, student.lga), {
    message: "That LGA is not in the chosen state",
    path: ["lga"],
  });

// A guardian's own details. How they relate to each child, and who is the
// primary contact, belong to the link, not the person.
export const UpdateGuardianSchema = z.object({
  firstName: Name,
  lastName: Name,
  phone: PhoneSchema,
  altPhone: blankAsUndefined(PhoneSchema),
  email: blankAsUndefined(z.email()),
  address: OptionalText,
  occupation: OptionalText,
});

export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;
export type UpdateGuardianDto = z.infer<typeof UpdateGuardianSchema>;
