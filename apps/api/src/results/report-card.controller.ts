import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { ReportCardReadService } from "@/results/report-card-read.service";

@Controller("results/report-cards")
@UseGuards(JwtAuthGuard)
export class ReportCardController {
  constructor(private readonly reportCards: ReportCardReadService) {}

  @Get("terms/:termId/students/:studentId")
  forStudent(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("studentId") studentId: string,
  ) {
    return this.reportCards.forStudent(actor, termId, studentId);
  }
}
