import { Body, Controller, Delete, Param, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import {
  UpdateGuardianSchema,
  UpdateStudentSchema,
  type UpdateGuardianDto,
  type UpdateStudentDto,
} from "@/students/schemas/update-student.schema";
import { StudentArchiveService } from "@/students/student-archive.service";
import { StudentUpdateService } from "@/students/student-update.service";
import { DeleteReasonSchema, type DeleteReasonDto } from "@/common/schemas/delete-reason.schema";

// Superadmin only: correcting a registered record is an owner's decision,
// unlike registration itself, and every correction is audited.
@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class StudentAdminController {
  constructor(
    private readonly updates: StudentUpdateService,
    private readonly archive: StudentArchiveService,
  ) {}

  @Delete(":studentId")
  removeStudent(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("studentId") studentId: string,
    @Body(new ZodValidationPipe(DeleteReasonSchema)) body: DeleteReasonDto,
  ) {
    return this.archive.remove(actor, studentId, body.reason);
  }

  @Put(":studentId")
  updateStudent(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("studentId") studentId: string,
    @Body(new ZodValidationPipe(UpdateStudentSchema)) body: UpdateStudentDto,
  ) {
    return this.updates.updateStudent(actor, studentId, body);
  }

  @Put("guardians/:guardianId")
  updateGuardian(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("guardianId") guardianId: string,
    @Body(new ZodValidationPipe(UpdateGuardianSchema)) body: UpdateGuardianDto,
  ) {
    return this.updates.updateGuardian(actor, guardianId, body);
  }
}
