import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { DayOfWeek } from "@prisma/client";
import { z } from "zod";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import {
  SetSlotSchema,
  SetSubjectLoadSchema,
  type SetSlotDto,
  type SetSubjectLoadDto,
} from "@/timetable/schemas/timetable.schema";
import { TimetableSubjectsService } from "@/timetable/timetable-subjects.service";
import { TimetableService } from "@/timetable/timetable.service";

const DayParam = new ZodValidationPipe(z.enum(DayOfWeek));

// No class-level @Roles(): who may write is "the writer roles, or this arm's
// own form teacher" — a per-arm check only the service can make, the same
// reason the debtors controller has no @Roles() either.
@Controller("timetable")
@UseGuards(JwtAuthGuard)
export class TimetableController {
  constructor(
    private readonly timetable: TimetableService,
    private readonly subjects: TimetableSubjectsService,
  ) {}

  @Get("sessions/:sessionId/arms/:classArmId")
  armGrid(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.timetable.armGrid(actor, sessionId, classArmId);
  }

  @Get("sessions/:sessionId/arms/:classArmId/subjects")
  availableSubjects(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.subjects.availableSubjects(actor, sessionId, classArmId);
  }

  @Get("sessions/:sessionId/arms/:classArmId/subjects/addable")
  addableSubjects(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.subjects.addableSubjects(actor, sessionId, classArmId);
  }

  @Post("sessions/:sessionId/arms/:classArmId/subjects/:subjectId")
  addSubject(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.subjects.addSubject(actor, sessionId, classArmId, subjectId);
  }

  @Delete("sessions/:sessionId/arms/:classArmId/subjects/:subjectId")
  removeSubject(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.subjects.removeSubject(actor, sessionId, classArmId, subjectId);
  }

  @Put("sessions/:sessionId/arms/:classArmId/subjects/:subjectId/load")
  setSubjectLoad(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
    @Body(new ZodValidationPipe(SetSubjectLoadSchema)) body: SetSubjectLoadDto,
  ) {
    return this.subjects.setSubjectLoad(actor, sessionId, classArmId, subjectId, body.periodsPerWeek, body.fixedDay);
  }

  @Post("sessions/:sessionId/arms/:classArmId/auto-generate")
  autoGenerate(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.subjects.autoGenerate(actor, sessionId, classArmId);
  }

  @Put("sessions/:sessionId/arms/:classArmId/days/:day/periods/:periodId")
  setSlot(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("classArmId") classArmId: string,
    @Param("day", DayParam) day: DayOfWeek,
    @Param("periodId") periodId: string,
    @Body(new ZodValidationPipe(SetSlotSchema)) body: SetSlotDto,
  ) {
    return this.timetable.setSlot(actor, sessionId, classArmId, day, periodId, body);
  }

  @Delete("slots/:slotId")
  clearSlot(@CurrentUser() actor: AuthenticatedStaff, @Param("slotId") slotId: string) {
    return this.timetable.clearSlot(actor, slotId);
  }

  @Get("sessions/:sessionId/staff/:staffId")
  staffTimetable(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Param("staffId") staffId: string,
  ) {
    return this.timetable.staffTimetable(actor, sessionId, staffId);
  }
}
