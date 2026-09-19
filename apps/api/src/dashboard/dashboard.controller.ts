import { Controller, Get, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { DashboardService } from "@/dashboard/dashboard.service";
import { StaffDashboardService } from "@/dashboard/staff-dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly staffDashboard: StaffDashboardService,
  ) {}

  // School leadership only: the feed names staff and students across the
  // whole school, which a teacher scoped to their own classes must not see.
  @Get()
  @Roles(Role.SUPERADMIN, Role.PRINCIPAL)
  overview(@CurrentUser() actor: AuthenticatedStaff) {
    return this.dashboard.overview(actor.schoolId);
  }

  // Any staff member: their own classes, scoped like every student read.
  @Get("me")
  mine(@CurrentUser() actor: AuthenticatedStaff) {
    return this.staffDashboard.overview(actor);
  }
}
