import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { SchoolProfileSchema, type SchoolProfileDto } from "@/school/school-profile";
import { SchoolProfileService } from "@/school/school-profile.service";

@Controller("school/profile")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolProfileController {
  constructor(private readonly profile: SchoolProfileService) {}

  // Receipts print these details, so the bursar and principal read them too.
  @Get()
  @Roles(Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR)
  get(@CurrentUser() actor: AuthenticatedStaff) {
    return this.profile.get(actor.schoolId);
  }

  @Put()
  @Roles(Role.SUPERADMIN)
  update(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(SchoolProfileSchema)) body: SchoolProfileDto,
  ) {
    return this.profile.update(actor, body);
  }
}
