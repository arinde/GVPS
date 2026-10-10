import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AttendanceService } from "@/attendance/attendance.service";
import {
  AttendanceDateQuerySchema,
  MarkAttendanceBatchSchema,
  type AttendanceDateQueryDto,
  type MarkAttendanceBatchDto,
} from "@/attendance/schemas/attendance.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// No class-level @Roles(): who may mark attendance is "the form teacher of
// this exact arm" or "the subject teacher of this exact subject × arm" — a
// per-arm/per-assignment check only the service can make (same reason the
// timetable and score-entry controllers have none either).
@Controller("attendance")
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get("arms/:classArmId/daily")
  getDaily(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("classArmId") classArmId: string,
    @Query(new ZodValidationPipe(AttendanceDateQuerySchema)) query: AttendanceDateQueryDto,
  ) {
    return this.attendance.getDaily(actor, classArmId, query.date);
  }

  @Post("arms/:classArmId/daily")
  markDaily(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("classArmId") classArmId: string,
    @Body(new ZodValidationPipe(MarkAttendanceBatchSchema)) body: MarkAttendanceBatchDto,
  ) {
    return this.attendance.markDaily(actor, classArmId, body);
  }

  @Get("arms/:classArmId/subjects/:subjectId/periods/:periodId")
  getPeriod(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
    @Param("periodId") periodId: string,
    @Query(new ZodValidationPipe(AttendanceDateQuerySchema)) query: AttendanceDateQueryDto,
  ) {
    return this.attendance.getPeriod(actor, classArmId, periodId, subjectId, query.date);
  }

  @Post("arms/:classArmId/subjects/:subjectId/periods/:periodId")
  markPeriod(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
    @Param("periodId") periodId: string,
    @Body(new ZodValidationPipe(MarkAttendanceBatchSchema)) body: MarkAttendanceBatchDto,
  ) {
    return this.attendance.markPeriod(actor, classArmId, periodId, subjectId, body);
  }

  @Get("students/:studentId/terms/:termId/summary")
  summary(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("studentId") studentId: string,
    @Param("termId") termId: string,
  ) {
    return this.attendance.studentSummary(actor, studentId, termId);
  }
}
