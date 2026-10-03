import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role, Section } from "@prisma/client";
import { z } from "zod";
import { AssessmentService } from "@/assessment/assessment.service";
import {
  SetAssessmentComponentsSchema,
  SetGradingScaleSchema,
  type SetAssessmentComponentsDto,
  type SetGradingScaleDto,
} from "@/assessment/schemas/assessment.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// FEATURES.md §11.2/§14: assessment configuration is the same bucket as
// academic structure — superadmin and principal write it, any signed-in
// staff member can read it.
const CONFIG_WRITERS = [Role.SUPERADMIN, Role.PRINCIPAL] as const;
const SectionQuery = new ZodValidationPipe(z.enum(Section));

@Controller("assessment")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentController {
  constructor(private readonly assessment: AssessmentService) {}

  @Get("terms/:termId/components")
  listComponents(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Query("section", SectionQuery) section: Section,
  ) {
    return this.assessment.listComponents(actor.schoolId, termId, section);
  }

  @Post("terms/:termId/components")
  @Roles(...CONFIG_WRITERS)
  setComponents(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Body(new ZodValidationPipe(SetAssessmentComponentsSchema)) body: SetAssessmentComponentsDto,
  ) {
    return this.assessment.setComponents(actor.id, actor.schoolId, termId, body);
  }

  @Get("grading-scales")
  getGradingScale(@CurrentUser() actor: AuthenticatedStaff, @Query("section", SectionQuery) section: Section) {
    return this.assessment.getGradingScale(actor.schoolId, section);
  }

  @Post("grading-scales")
  @Roles(...CONFIG_WRITERS)
  setGradingScale(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(SetGradingScaleSchema)) body: SetGradingScaleDto,
  ) {
    return this.assessment.setGradingScale(actor.id, actor.schoolId, body);
  }
}
