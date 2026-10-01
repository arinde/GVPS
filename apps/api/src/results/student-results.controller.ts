import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { StudentResultsService } from "@/results/student-results.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// No @Roles() here on purpose — StudentResultsService does its own, finer
// check (bursar and subject teacher are excluded; form teacher is arm-scoped)
// that a role list on the controller can't express.
@Controller("results")
@UseGuards(JwtAuthGuard)
export class StudentResultsController {
  constructor(private readonly results: StudentResultsService) {}

  @Get("students/:studentId")
  getForStudent(@CurrentUser() actor: AuthenticatedStaff, @Param("studentId") studentId: string) {
    return this.results.getForStudent(actor, studentId);
  }
}
