import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { REGISTRATION_ROLES } from "@/access/access-scope";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { StudentPhotoSchema, type StudentPhotoDto } from "@/students/schemas/student-photo.schema";
import { StudentPhotoService } from "@/students/student-photo.service";

// Anyone who can see a student can see their photo; setting one is for the
// roles that register students. The service applies the class scope to both.
@Controller("students/:studentId/photo")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentPhotoController {
  constructor(private readonly photos: StudentPhotoService) {}

  @Get()
  get(@CurrentUser() actor: AuthenticatedStaff, @Param("studentId") studentId: string) {
    return this.photos.get(actor, studentId);
  }

  @Put()
  @Roles(...REGISTRATION_ROLES)
  set(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("studentId") studentId: string,
    @Body(new ZodValidationPipe(StudentPhotoSchema)) body: StudentPhotoDto,
  ) {
    return this.photos.set(actor, studentId, body);
  }
}
