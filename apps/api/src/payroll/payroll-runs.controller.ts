import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { BankScheduleService } from "@/payroll/bank-schedule.service";
import { PayrollRunsService } from "@/payroll/payroll-runs.service";
import { PAYROLL_READERS } from "@/payroll/payslips.service";
import { CreatePayrollRunSchema, type CreatePayrollRunDto } from "@/payroll/schemas/payroll.schemas";

// FEATURES.md §14 "Staff / payroll" row: superadmin runs payroll; principal,
// bursar and admin read it.
@Controller("payroll/runs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_READERS)
export class PayrollRunsController {
  constructor(
    private readonly runs: PayrollRunsService,
    private readonly bankSchedule: BankScheduleService,
  ) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff) {
    return this.runs.list(actor.schoolId);
  }

  @Get(":runId")
  get(@CurrentUser() actor: AuthenticatedStaff, @Param("runId") runId: string) {
    return this.runs.get(actor.schoolId, runId);
  }

  // Full account numbers: superadmin only, unlike the rest of this controller.
  @Get(":runId/bank-schedule")
  @Roles(Role.SUPERADMIN)
  bankScheduleFor(@CurrentUser() actor: AuthenticatedStaff, @Param("runId") runId: string) {
    return this.bankSchedule.forRun(actor, runId);
  }

  @Post()
  @Roles(Role.SUPERADMIN)
  create(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreatePayrollRunSchema)) body: CreatePayrollRunDto,
  ) {
    return this.runs.create(actor, body);
  }

  @Post(":runId/refresh")
  @Roles(Role.SUPERADMIN)
  refresh(@CurrentUser() actor: AuthenticatedStaff, @Param("runId") runId: string) {
    return this.runs.refresh(actor, runId);
  }

  @Post(":runId/finalise")
  @Roles(Role.SUPERADMIN)
  finalise(@CurrentUser() actor: AuthenticatedStaff, @Param("runId") runId: string) {
    return this.runs.finalise(actor, runId);
  }

  @Delete(":runId")
  @Roles(Role.SUPERADMIN)
  remove(@CurrentUser() actor: AuthenticatedStaff, @Param("runId") runId: string) {
    return this.runs.remove(actor, runId);
  }
}
