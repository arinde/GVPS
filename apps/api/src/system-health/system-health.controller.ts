import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { SystemHealthService } from "@/system-health/system-health.service";

// FEATURES.md §11 "system administration" — infrastructure health is a
// superadmin concern, the same tier that manages staff accounts.
@Controller("system-health")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class SystemHealthController {
  constructor(private readonly health: SystemHealthService) {}

  @Get("status")
  status(@CurrentUser() actor: AuthenticatedStaff) {
    return this.health.liveStatus(actor);
  }

  @Get("history")
  history(@CurrentUser() actor: AuthenticatedStaff, @Query("days") days?: string) {
    const parsed = Number(days);
    const windowDays = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 30) : 7;
    return this.health.history(actor, windowDays);
  }
}
