import { Controller, Get, UseGuards } from "@nestjs/common";
import { StaffAccountService } from "@/auth/staff-account.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

/**
 * The signed-in staff member's own record, for their "My profile" page.
 *
 * Open to every role, and it can only ever return the caller: the id comes
 * from the verified token, never from the request. There is deliberately no
 * write route here. Changing your own details — above all your salary account
 * — goes through the superadmin; otherwise anyone who got into an account
 * could redirect that person's pay in one step.
 */
@Controller("me")
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly staffAccounts: StaffAccountService) {}

  @Get("profile")
  profile(@CurrentUser() actor: AuthenticatedStaff) {
    return this.staffAccounts.getProfile(actor.schoolId, actor.id);
  }
}
