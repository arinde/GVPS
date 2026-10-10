import { Controller, Get, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "@/analytics/analytics.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// No class-level @Roles(): each card has its own reader list (academic vs
// financial), so the service makes the check per endpoint.
@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("enrolment")
  enrolment(@CurrentUser() actor: AuthenticatedStaff) {
    return this.analytics.enrolment(actor);
  }

  @Get("academic")
  academic(@CurrentUser() actor: AuthenticatedStaff) {
    return this.analytics.academic(actor);
  }

  @Get("attendance")
  attendance(@CurrentUser() actor: AuthenticatedStaff) {
    return this.analytics.attendance(actor);
  }

  @Get("financial")
  financial(@CurrentUser() actor: AuthenticatedStaff) {
    return this.analytics.financial(actor);
  }
}
