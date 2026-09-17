import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { ClassStructureService } from "@/academic/class-structure.service";
import { SessionService } from "@/academic/session.service";
import {
  CreateClassArmSchema,
  CreateClassLevelSchema,
  type CreateClassArmDto,
  type CreateClassLevelDto,
} from "@/academic/schemas/class-structure.schema";
import {
  CreateSessionSchema,
  TermInputSchema,
  UpdateTermSchema,
  type CreateSessionDto,
  type TermInputDto,
  type UpdateTermDto,
} from "@/academic/schemas/session.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// FEATURES.md §14: academic structure is configuration — superadmin and
// principal write it. Reads are open to any authenticated staff member,
// because a teacher cannot do anything useful without knowing the arms and
// the current term. Every read is still scoped to the caller's school.
const STRUCTURE_WRITERS = [Role.SUPERADMIN, Role.PRINCIPAL] as const;

@Controller("academic")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicController {
  constructor(
    private readonly sessions: SessionService,
    private readonly structure: ClassStructureService,
  ) {}

  @Get("current")
  getCurrent(@CurrentUser() actor: AuthenticatedStaff) {
    return this.sessions.getCurrent(actor.schoolId);
  }

  @Get("sessions")
  listSessions(@CurrentUser() actor: AuthenticatedStaff) {
    return this.sessions.listSessions(actor.schoolId);
  }

  @Post("sessions")
  @Roles(...STRUCTURE_WRITERS)
  createSession(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreateSessionSchema)) body: CreateSessionDto,
  ) {
    return this.sessions.createSession(actor.id, actor.schoolId, body);
  }

  @Post("sessions/:sessionId/set-current")
  @Roles(...STRUCTURE_WRITERS)
  setCurrentSession(@CurrentUser() actor: AuthenticatedStaff, @Param("sessionId") sessionId: string) {
    return this.sessions.setCurrentSession(actor.id, actor.schoolId, sessionId);
  }

  @Post("sessions/:sessionId/terms")
  @Roles(...STRUCTURE_WRITERS)
  addTerm(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("sessionId") sessionId: string,
    @Body(new ZodValidationPipe(TermInputSchema)) body: TermInputDto,
  ) {
    return this.sessions.addTerm(actor.id, actor.schoolId, sessionId, body);
  }

  @Post("terms/:termId/set-current")
  @Roles(...STRUCTURE_WRITERS)
  setCurrentTerm(@CurrentUser() actor: AuthenticatedStaff, @Param("termId") termId: string) {
    return this.sessions.setCurrentTerm(actor.id, actor.schoolId, termId);
  }

  @Patch("terms/:termId")
  @Roles(...STRUCTURE_WRITERS)
  updateTerm(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Body(new ZodValidationPipe(UpdateTermSchema)) body: UpdateTermDto,
  ) {
    return this.sessions.setTimesSchoolOpened(actor.id, actor.schoolId, termId, body.timesSchoolOpened);
  }

  @Get("levels")
  listLevels(@CurrentUser() actor: AuthenticatedStaff) {
    return this.structure.listLevels(actor.schoolId);
  }

  @Post("levels")
  @Roles(...STRUCTURE_WRITERS)
  createLevel(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreateClassLevelSchema)) body: CreateClassLevelDto,
  ) {
    return this.structure.createLevel(actor.id, actor.schoolId, body);
  }

  @Get("arms")
  listArms(@CurrentUser() actor: AuthenticatedStaff) {
    return this.structure.listArms(actor.schoolId);
  }

  @Post("levels/:levelId/arms")
  @Roles(...STRUCTURE_WRITERS)
  createArm(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("levelId") levelId: string,
    @Body(new ZodValidationPipe(CreateClassArmSchema)) body: CreateClassArmDto,
  ) {
    return this.structure.createArm(actor.id, actor.schoolId, levelId, body);
  }
}
