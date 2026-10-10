import { z } from "zod";
import { DayOfWeek, Section } from "@prisma/client";

const TimeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM, e.g. 08:30");

export const CreatePeriodSchema = z
  .object({
    section: z.enum(Section),
    name: z.string().trim().min(1, "Name this period.").max(40),
    startTime: TimeOfDay,
    endTime: TimeOfDay,
    isTeaching: z.boolean().default(true),
  })
  .refine((period) => period.endTime > period.startTime, {
    message: "End time must be after the start time.",
    path: ["endTime"],
  });
export type CreatePeriodDto = z.infer<typeof CreatePeriodSchema>;

export const UpdatePeriodSchema = z
  .object({
    name: z.string().trim().min(1, "Name this period.").max(40),
    startTime: TimeOfDay,
    endTime: TimeOfDay,
    isTeaching: z.boolean(),
  })
  .refine((period) => period.endTime > period.startTime, {
    message: "End time must be after the start time.",
    path: ["endTime"],
  });
export type UpdatePeriodDto = z.infer<typeof UpdatePeriodSchema>;

export const SetSlotSchema = z.object({ subjectId: z.string().trim().min(1, "Choose a subject.") });
export type SetSlotDto = z.infer<typeof SetSlotSchema>;

export const SetSubjectLoadSchema = z.object({
  periodsPerWeek: z.int().min(1, "At least one period a week.").max(20),
  fixedDay: z.enum(DayOfWeek).nullable().default(null),
});
export type SetSubjectLoadDto = z.infer<typeof SetSubjectLoadSchema>;
