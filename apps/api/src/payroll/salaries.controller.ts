import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PAYROLL_READERS } from "@/payroll/payslips.service";
import { SalariesService } from "@/payroll/salaries.service";
import { SavePayLinesSchema, type SavePayLinesDto } from "@/payroll/schemas/payroll.schemas";

// FEATURES.md §14 "Staff / payroll" row: superadmin writes; principal,
// bursar and admin read.
@Controller("payroll/salaries")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_READERS)
export class SalariesController {
  constructor(private readonly salaries: SalariesService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff) {
    return this.salaries.list(actor.schoolId);
  }

  @Put(":staffId")
  @Roles(Role.SUPERADMIN)
  save(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("staffId") staffId: string,
    @Body(new ZodValidationPipe(SavePayLinesSchema)) body: SavePayLinesDto,
  ) {
    return this.salaries.save(actor, staffId, body);
  }
}
