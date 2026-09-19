import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { SubjectAssignmentsService } from "@/subjects/subject-assignments.service";
import {
  AddOfferingsSchema,
  AssignClassSubjectsSchema,
  AssignSubjectSchema,
  SubjectSchema,
  UpdateOfferingSchema,
  type AddOfferingsDto,
  type AssignClassSubjectsDto,
  type AssignSubjectDto,
  type SubjectDto,
  type UpdateOfferingDto,
} from "@/subjects/subjects.schemas";
import { SubjectsService } from "@/subjects/subjects.service";

// FEATURES.md §14: the catalogue is academic configuration — superadmin and
// principal write it; any staff member reads it.
const CATALOGUE_WRITERS = [Role.SUPERADMIN, Role.PRINCIPAL] as const;

@Controller("subjects")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff) {
    return this.subjects.list(actor.schoolId);
  }

  @Post()
  @Roles(...CATALOGUE_WRITERS)
  create(@CurrentUser() actor: AuthenticatedStaff, @Body(new ZodValidationPipe(SubjectSchema)) body: SubjectDto) {
    return this.subjects.create(actor, body);
  }

  @Put(":subjectId")
  @Roles(...CATALOGUE_WRITERS)
  update(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("subjectId") subjectId: string,
    @Body(new ZodValidationPipe(SubjectSchema)) body: SubjectDto,
  ) {
    return this.subjects.update(actor, subjectId, body);
  }

  @Delete(":subjectId")
  @Roles(...CATALOGUE_WRITERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() actor: AuthenticatedStaff, @Param("subjectId") subjectId: string) {
    return this.subjects.remove(actor, subjectId);
  }

  @Post(":subjectId/offerings")
  @Roles(...CATALOGUE_WRITERS)
  addOfferings(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("subjectId") subjectId: string,
    @Body(new ZodValidationPipe(AddOfferingsSchema)) body: AddOfferingsDto,
  ) {
    return this.subjects.addOfferings(actor, subjectId, body);
  }

  @Put("offerings/:offeringId")
  @Roles(...CATALOGUE_WRITERS)
  updateOffering(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("offeringId") offeringId: string,
    @Body(new ZodValidationPipe(UpdateOfferingSchema)) body: UpdateOfferingDto,
  ) {
    return this.subjects.updateOffering(actor, offeringId, body);
  }

  @Delete("offerings/:offeringId")
  @Roles(...CATALOGUE_WRITERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOffering(@CurrentUser() actor: AuthenticatedStaff, @Param("offeringId") offeringId: string) {
    return this.subjects.removeOffering(actor, offeringId);
  }
}

// Superadmin only: a teaching assignment gives a teacher access to that
// class's students, so it is a privilege decision, like class allocation.
@Controller("subject-assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class SubjectAssignmentsController {
  constructor(private readonly assignments: SubjectAssignmentsService) {}

  @Get("staff/:staffId")
  forStaff(@CurrentUser() actor: AuthenticatedStaff, @Param("staffId") staffId: string) {
    return this.assignments.forStaff(actor.schoolId, staffId);
  }

  @Get("subject/:subjectId/classes")
  classesForSubject(@CurrentUser() actor: AuthenticatedStaff, @Param("subjectId") subjectId: string) {
    return this.assignments.classesForSubject(actor.schoolId, subjectId);
  }

  @Post()
  assign(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(AssignSubjectSchema)) body: AssignSubjectDto,
  ) {
    return this.assignments.assign(actor, body);
  }

  @Post("whole-class")
  assignWholeClass(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(AssignClassSubjectsSchema)) body: AssignClassSubjectsDto,
  ) {
    return this.assignments.assignWholeClass(actor, body);
  }

  @Delete(":assignmentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  unassign(@CurrentUser() actor: AuthenticatedStaff, @Param("assignmentId") assignmentId: string) {
    return this.assignments.unassign(actor, assignmentId);
  }
}
