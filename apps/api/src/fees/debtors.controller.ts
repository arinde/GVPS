import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { DebtorsService } from "@/fees/debtors.service";

// No @Roles() here on purpose — DebtorsService does its own check (form
// teacher is arm-scoped; subject teacher and admin have no access at all),
// which a flat role list on the controller can't express.
@Controller("fees/debtors")
@UseGuards(JwtAuthGuard)
export class DebtorsController {
  constructor(private readonly debtors: DebtorsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff) {
    return this.debtors.list(actor);
  }
}
