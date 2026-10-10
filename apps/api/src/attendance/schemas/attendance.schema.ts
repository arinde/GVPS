import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

// One student's mark for the day (or the period, when periodId is set at the
// controller). Scoped by path params (classArmId, date[, periodId]) so a
// client cannot write attendance into a class it didn't ask to open.
export const MarkAttendanceSchema = z.object({
  studentId: z.string().trim().min(1),
  status: z.enum(AttendanceStatus),
});
export type MarkAttendanceDto = z.infer<typeof MarkAttendanceSchema>;

// A whole arm's register saved at once — each student's mark is still
// applied independently server-side, so one bad row doesn't fail the rest
// (same reasoning as score entry's batch save, for the same offline queue).
export const MarkAttendanceBatchSchema = z.object({
  date: DateOnly,
  marks: z.array(MarkAttendanceSchema).min(1),
});
export type MarkAttendanceBatchDto = z.infer<typeof MarkAttendanceBatchSchema>;

export const AttendanceDateQuerySchema = z.object({ date: DateOnly });
export type AttendanceDateQueryDto = z.infer<typeof AttendanceDateQuerySchema>;
