import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PayslipsService } from "@/payroll/payslips.service";
import { SavePayLinesSchema, type SavePayLinesDto } from "@/payroll/schemas/payroll.schemas";

// No class-level @Roles(): every staff member can read their own finalised
// payslips. PayslipsService decides who may read which; adjusting a draft is
// the superadmin's alone.
@Controller("payroll/payslips")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  @Get("mine")
  mine(@CurrentUser() actor: AuthenticatedStaff) {
    return this.payslips.mine(actor);
  }

  @Get(":payslipId")
  printable(@CurrentUser() actor: AuthenticatedStaff, @Param("payslipId") payslipId: string) {
    return this.payslips.printable(actor, payslipId);
  }

  @Put(":payslipId")
  @Roles(Role.SUPERADMIN)
  update(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("payslipId") payslipId: string,
    @Body(new ZodValidationPipe(SavePayLinesSchema)) body: SavePayLinesDto,
  ) {
    return this.payslips.update(actor, payslipId, body);
  }
}
