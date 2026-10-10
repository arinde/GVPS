import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { BroadsheetService } from "@/results/broadsheet.service";

@Controller("results/broadsheet")
@UseGuards(JwtAuthGuard)
export class BroadsheetController {
  constructor(private readonly broadsheet: BroadsheetService) {}

  @Get("terms/:termId/arms/:classArmId")
  forArm(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.broadsheet.forArm(actor, termId, classArmId);
  }
}
