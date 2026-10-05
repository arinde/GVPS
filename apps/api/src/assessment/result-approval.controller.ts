import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { ResultApprovalService } from "@/assessment/result-approval.service";

const UnlockSchema = z.object({
  reason: z.string().trim().min(1, "Give a reason for reopening these scores.").max(200),
});

// Who may do each step is decided in the service (FEATURES.md §14 "Result
// approval" row), so no class-level @Roles() here.
@Controller("assessment/approval/terms/:termId/arms/:classArmId")
@UseGuards(JwtAuthGuard)
export class ResultApprovalController {
  constructor(private readonly approval: ResultApprovalService) {}

  @Get()
  status(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.approval.status(actor, termId, classArmId);
  }

  @Get("subjects/:subjectId/scores")
  scores(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.approval.scores(actor, termId, classArmId, subjectId);
  }

  @Post("subjects/:subjectId/submit")
  submit(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.approval.submit(actor, termId, classArmId, subjectId);
  }

  @Post("subjects/:subjectId/review")
  review(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.approval.review(actor, termId, classArmId, subjectId);
  }

  @Post("subjects/:subjectId/approve")
  approve(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
  ) {
    return this.approval.approve(actor, termId, classArmId, subjectId);
  }

  @Post("subjects/:subjectId/unlock")
  unlock(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
    @Param("subjectId") subjectId: string,
    @Body(new ZodValidationPipe(UnlockSchema)) body: z.infer<typeof UnlockSchema>,
  ) {
    return this.approval.unlock(actor, termId, classArmId, subjectId, body.reason);
  }

  @Post("publish")
  publish(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.approval.publishArm(actor, termId, classArmId);
  }
}
