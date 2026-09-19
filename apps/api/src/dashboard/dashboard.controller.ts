import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { DashboardService } from "@/dashboard/dashboard.service";

// School leadership only: the feed names staff and students across the whole
// school, which a teacher scoped to their own classes must not see.
@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.PRINCIPAL)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(@CurrentUser() actor: AuthenticatedStaff) {
    return this.dashboard.overview(actor.schoolId);
  }
}
