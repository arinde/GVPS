import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type { TeachingResourceType } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import {
  RejectTeachingResourceSchema,
  SaveTeachingResourceSchema,
  type RejectTeachingResourceDto,
  type SaveTeachingResourceDto,
} from "@/teaching-resources/schemas/teaching-resource.schema";
import { TeachingResourcesService } from "@/teaching-resources/teaching-resources.service";

// No @Roles() here: FEATURES.md scope is "teachers and admins, any class" —
// every signed-in staff member can create and submit; TeachingResourcesService
// itself checks the principal/superadmin-only approve and reject steps.
@Controller("teaching-resources")
@UseGuards(JwtAuthGuard)
export class TeachingResourcesController {
  constructor(private readonly resources: TeachingResourcesService) {}

  @Get()
  list(
    @CurrentUser() actor: AuthenticatedStaff,
    @Query("type") type?: TeachingResourceType,
    @Query("subjectId") subjectId?: string,
    @Query("classLevelId") classLevelId?: string,
    @Query("termId") termId?: string,
  ) {
    return this.resources.list(actor, { type, subjectId, classLevelId, termId });
  }

  @Get(":id")
  get(@CurrentUser() actor: AuthenticatedStaff, @Param("id") id: string) {
    return this.resources.get(actor, id);
  }

  @Post()
  create(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(SaveTeachingResourceSchema)) body: SaveTeachingResourceDto,
  ) {
    return this.resources.create(actor, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(SaveTeachingResourceSchema)) body: SaveTeachingResourceDto,
  ) {
    return this.resources.update(actor, id, body);
  }

  @Post(":id/submit")
  submit(@CurrentUser() actor: AuthenticatedStaff, @Param("id") id: string) {
    return this.resources.submit(actor, id);
  }

  @Post(":id/approve")
  approve(@CurrentUser() actor: AuthenticatedStaff, @Param("id") id: string) {
    return this.resources.approve(actor, id);
  }

  @Post(":id/reject")
  reject(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(RejectTeachingResourceSchema)) body: RejectTeachingResourceDto,
  ) {
    return this.resources.reject(actor, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() actor: AuthenticatedStaff, @Param("id") id: string) {
    return this.resources.remove(actor, id);
  }
}
