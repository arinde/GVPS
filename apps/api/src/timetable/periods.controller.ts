import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { Section } from "@prisma/client";
import { z } from "zod";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PeriodsService } from "@/timetable/periods.service";
import {
  CreatePeriodSchema,
  UpdatePeriodSchema,
  type CreatePeriodDto,
  type UpdatePeriodDto,
} from "@/timetable/schemas/timetable.schema";
import { WRITERS } from "@/timetable/timetable.service";

const SectionQuery = new ZodValidationPipe(z.enum(Section));

// FEATURES.md §14 "Timetable" row: superadmin, principal and admin/secretary
// write; everyone except the bursar reads (checked in the service).
@Controller("timetable/periods")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodsController {
  constructor(private readonly periods: PeriodsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff, @Query("section", SectionQuery) section: Section) {
    return this.periods.list(actor, section);
  }

  @Post()
  @Roles(...WRITERS)
  create(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreatePeriodSchema)) body: CreatePeriodDto,
  ) {
    return this.periods.create(actor, body);
  }

  @Put(":periodId")
  @Roles(...WRITERS)
  update(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("periodId") periodId: string,
    @Body(new ZodValidationPipe(UpdatePeriodSchema)) body: UpdatePeriodDto,
  ) {
    return this.periods.update(actor, periodId, body);
  }

  @Delete(":periodId")
  @Roles(...WRITERS)
  remove(@CurrentUser() actor: AuthenticatedStaff, @Param("periodId") periodId: string) {
    return this.periods.remove(actor, periodId);
  }
}
