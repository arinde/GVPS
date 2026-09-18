import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { CreateStudentSchema, type CreateStudentDto } from "@/students/schemas/create-student.schema";
import { StudentsService } from "@/students/students.service";

// FEATURES.md §1.6 and §14: student and guardian records are data, created by
// the office. Deliberately NOT superadmin-gated — routing 400 records through
// the proprietor guarantees Phase 1 stalls. Privilege changes stay separate.
const REGISTRY_WRITERS = [Role.SUPERADMIN, Role.ADMIN_SECRETARY, Role.PRINCIPAL] as const;

@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Post()
  @Roles(...REGISTRY_WRITERS)
  register(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreateStudentSchema)) body: CreateStudentDto,
  ) {
    return this.students.register(actor.id, actor.schoolId, body);
  }

  @Get()
  search(
    @CurrentUser() actor: AuthenticatedStaff,
    @Query("q") query?: string,
    @Query("armId") classArmId?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    // Capped regardless of what the caller asks for: an unbounded registry
    // list is the payload that breaks a phone on a weak connection.
    const parsed = Number.parseInt(limit ?? "50", 10);
    const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50;

    return this.students.search(actor.schoolId, { query, classArmId, cursor, limit: safeLimit });
  }

  // Query parameter, not a path segment: admission numbers contain slashes
  // ("GVPS/2026/0001"), which a route parameter would split. Declared before
  // ":studentId" so "lookup" is not captured as an id.
  @Get("lookup")
  lookup(@CurrentUser() actor: AuthenticatedStaff, @Query("admissionNo") admissionNo?: string) {
    if (!admissionNo?.trim()) throw new BadRequestException([{ path: ["admissionNo"], message: "Required" }]);
    return this.students.findByAdmissionNo(actor.schoolId, admissionNo);
  }

  @Get(":studentId")
  findOne(@CurrentUser() actor: AuthenticatedStaff, @Param("studentId") studentId: string) {
    return this.students.findOne(actor.schoolId, studentId);
  }
}
