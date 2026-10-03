import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ScoreEntryService } from "@/assessment/score-entry.service";
import {
  SaveScoreBatchSchema,
  UpsertScoreSchema,
  type SaveScoreBatchDto,
  type UpsertScoreDto,
} from "@/assessment/schemas/score.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// No @Roles() here on purpose — who may use a given (term, subject, arm) is
// decided per request by ScoreEntryService against SubjectAssignment, not by
// role name alone (FEATURES.md §1.1: "subject teacher: assigned subjects only").
@Controller("assessment/scores")
@UseGuards(JwtAuthGuard)
export class ScoreEntryController {
  constructor(private readonly scoreEntry: ScoreEntryService) {}

  @Get(":termId/:subjectId/:classArmId")
  getGrid(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("subjectId") subjectId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.scoreEntry.getGrid(actor, termId, subjectId, classArmId);
  }

  @Put(":termId/:subjectId/:classArmId")
  upsertScore(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("subjectId") subjectId: string,
    @Param("classArmId") classArmId: string,
    @Body(new ZodValidationPipe(UpsertScoreSchema)) body: UpsertScoreDto,
  ) {
    return this.scoreEntry.upsertScore(actor, termId, subjectId, classArmId, body);
  }

  @Put(":termId/:subjectId/:classArmId/batch")
  saveBatch(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("subjectId") subjectId: string,
    @Param("classArmId") classArmId: string,
    @Body(new ZodValidationPipe(SaveScoreBatchSchema)) body: SaveScoreBatchDto,
  ) {
    return this.scoreEntry.saveBatch(actor, termId, subjectId, classArmId, body.scores);
  }
}
