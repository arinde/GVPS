import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { ClassAssignmentsService } from "@/class-assignments/class-assignments.service";
import { SetClassTeacherSchema, type SetClassTeacherDto } from "@/class-assignments/set-class-teacher.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// Superadmin only. Allocating a class grants a teacher access to those
// children's records, so it is a privilege decision (PLAN.md §4.12).
@Controller("class-assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class ClassAssignmentsController {
  constructor(private readonly assignments: ClassAssignmentsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff) {
    return this.assignments.listForCurrentSession(actor.schoolId);
  }

  // PUT because it sets the class's teacher to a value, idempotently —
  // sending the same teacher twice changes nothing.
  @Put(":classArmId")
  setTeacher(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("classArmId") classArmId: string,
    @Body(new ZodValidationPipe(SetClassTeacherSchema)) body: SetClassTeacherDto,
  ) {
    return this.assignments.setClassTeacher(actor.id, actor.schoolId, classArmId, body.staffId);
  }
}
