import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { EnrolmentChangesService } from "@/promotions/enrolment-changes.service";
import {
  ExitSchema,
  PromoteSchema,
  TransferSchema,
  type ExitDto,
  type PromoteDto,
  type TransferDto,
} from "@/promotions/promotions.schemas";
import { PromotionsService } from "@/promotions/promotions.service";

// Promotion decides who moves up a year and reissues admission numbers, so it
// sits with school leadership (FEATURES.md §14), not the office.
@Controller("promotions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.PRINCIPAL)
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get("classes/:classArmId")
  candidates(@CurrentUser() actor: AuthenticatedStaff, @Param("classArmId") classArmId: string) {
    return this.promotions.candidates(actor.schoolId, classArmId);
  }

  @Post()
  promote(@CurrentUser() actor: AuthenticatedStaff, @Body(new ZodValidationPipe(PromoteSchema)) body: PromoteDto) {
    return this.promotions.promote(actor, body);
  }
}

// Correcting a class or recording that a student left is office work, so the
// secretary can do it too.
@Controller("enrolments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY)
export class EnrolmentsController {
  constructor(private readonly changes: EnrolmentChangesService) {}

  @Put(":enrolmentId/class")
  transfer(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("enrolmentId") enrolmentId: string,
    @Body(new ZodValidationPipe(TransferSchema)) body: TransferDto,
  ) {
    return this.changes.transfer(actor, enrolmentId, body);
  }

  @Post(":enrolmentId/exit")
  exit(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("enrolmentId") enrolmentId: string,
    @Body(new ZodValidationPipe(ExitSchema)) body: ExitDto,
  ) {
    return this.changes.exit(actor, enrolmentId, body);
  }
}
