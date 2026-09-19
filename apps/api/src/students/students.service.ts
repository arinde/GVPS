import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EnrolmentStatus, type Prisma, type Student } from "@prisma/client";
import { mayRegisterInto } from "@/access/access-scope";
import { AccessScopeService } from "@/access/access-scope.service";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import { AdmissionNumberService } from "@/students/admission-number.service";
import { resolveStream, withOnePrimary } from "@/students/registration-rules";
import { withSiblings } from "@/students/student-profile";
import type { CreateStudentDto, GuardianInputDto } from "@/students/schemas/create-student.schema";

export type StudentSearch = {
  query?: string;
  classArmId?: string;
  limit: number;
  cursor?: string;
};

/**
 * Student registry (FEATURES.md §3.2–3.4).
 *
 * Registration writes three things atomically: the student, their guardian
 * links, and an enrolment into the current session. The enrolment is not
 * optional — a student with no enrolment is invisible to every screen that
 * filters by the current session, which is nearly all of them.
 */
@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly admissionNumbers: AdmissionNumberService,
    private readonly access: AccessScopeService,
  ) {}

  async register(actor: AuthenticatedStaff, dto: CreateStudentDto): Promise<Student> {
    const { id: actorStaffId, schoolId } = actor;
    const school = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

    const arm = await this.prisma.classArm.findFirst({
      where: { id: dto.classArmId, schoolId },
      include: { classLevel: true },
    });
    if (!arm) throw new NotFoundException("Class arm not found.");

    // Checked before the transaction, so a refused registration never
    // allocates — and so never wastes — an admission number.
    const { armIds } = await this.access.allocatedArms(actor);
    if (!mayRegisterInto(actor.roles, armIds, arm.id)) {
      throw new ForbiddenException([
        { path: ["classArmId"], message: "You can only register students into a class allocated to you" },
      ]);
    }

    const stream = resolveStream(arm, dto.stream);

    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    if (!session) {
      throw new BadRequestException(
        "No current academic session is set. Set one before registering students, or their enrolment has nowhere to go.",
      );
    }

    await this.assertNotDuplicate(schoolId, dto);

    const student = await this.prisma.$transaction(async (tx) => {
      const admittedOn = new Date(dto.dateOfAdmission);
      const admissionNo = await this.admissionNumbers.allocate(tx, school, admittedOn);

      const created = await tx.student.create({
        data: {
          schoolId,
          admissionNo,
          firstName: dto.firstName,
          lastName: dto.lastName,
          otherNames: dto.otherNames,
          dateOfBirth: new Date(dto.dateOfBirth),
          sex: dto.sex,
          nationality: dto.nationality,
          stateOfOrigin: dto.stateOfOrigin,
          lga: dto.lga,
          dateOfAdmission: admittedOn,
          admittedIntoLevelId: arm.classLevelId,
          address: dto.address,
          bloodGroup: dto.bloodGroup,
          medicalNote: dto.medicalNote,
          previousSchool: dto.previousSchool,
        },
      });

      for (const guardian of withOnePrimary(dto.guardians)) {
        await this.linkGuardian(tx, schoolId, created.id, guardian);
      }

      await tx.enrolment.create({
        data: {
          schoolId,
          studentId: created.id,
          sessionId: session.id,
          classArmId: arm.id,
          stream,
          status: EnrolmentStatus.ACTIVE,
        },
      });

      return created;
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "student.registered",
      entityType: "Student",
      entityId: student.id,
      after: {
        admissionNo: student.admissionNo,
        name: `${student.lastName}, ${student.firstName}`,
        arm: `${arm.classLevel.name}${arm.name}`,
        stream,
        session: session.name,
      },
    });

    return student;
  }

  /**
   * Guardians are looked up by phone and reused. Entering the same parent for
   * a second child links the existing record rather than cloning it, which is
   * what makes family-level fee statements and the parent portal work at all.
   */
  private async linkGuardian(
    tx: Prisma.TransactionClient,
    schoolId: string,
    studentId: string,
    input: GuardianInputDto,
  ): Promise<void> {
    const guardian = await tx.guardian.upsert({
      where: { schoolId_phone: { schoolId, phone: input.phone } },
      create: {
        schoolId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        altPhone: input.altPhone,
        email: input.email,
        address: input.address,
        occupation: input.occupation,
      },
      // Only fill blanks on an existing guardian. Overwriting what the office
      // already holds because a second form was typed more carelessly is how
      // good contact data rots.
      update: {
        altPhone: input.altPhone ?? undefined,
        email: input.email ?? undefined,
        address: input.address ?? undefined,
        occupation: input.occupation ?? undefined,
      },
    });

    await tx.studentGuardian.create({
      data: {
        schoolId,
        studentId,
        guardianId: guardian.id,
        relationship: input.relationship,
        isPrimary: input.isPrimary,
      },
    });
  }

  /** FEATURES.md §3.5: duplicate detection on name + date of birth. */
  private async assertNotDuplicate(schoolId: string, dto: CreateStudentDto): Promise<void> {
    const existing = await this.prisma.student.findFirst({
      where: {
        schoolId,
        firstName: { equals: dto.firstName, mode: "insensitive" },
        lastName: { equals: dto.lastName, mode: "insensitive" },
        dateOfBirth: new Date(dto.dateOfBirth),
      },
    });
    if (existing) {
      throw new ConflictException(
        `${dto.lastName}, ${dto.firstName} with that date of birth is already registered as ${existing.admissionNo}.`,
      );
    }
  }

  /** Registry list. Paginated by cursor — TESTS.md §12 forbids unbounded lists. */
  async search(actor: AuthenticatedStaff, params: StudentSearch) {
    const schoolId = actor.schoolId;
    const query = params.query?.trim();
    const scope = await this.access.studentScope(actor);

    // Asking for a specific class outside your scope is refused outright
    // (TESTS.md §6.2), not silently answered with an empty list.
    if (params.classArmId && scope.kind === "arms" && !scope.armIds.includes(params.classArmId)) {
      throw new ForbiddenException("That class is not allocated to you.");
    }

    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        AND: [AccessScopeService.studentWhere(scope)],
        ...(params.classArmId
          ? { enrolments: { some: { classArmId: params.classArmId, status: EnrolmentStatus.ACTIVE } } }
          : {}),
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { admissionNo: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: {
        admittedIntoLevel: true,
        enrolments: {
          where: { status: EnrolmentStatus.ACTIVE },
          include: { classArm: { include: { classLevel: true } } },
          take: 1,
        },
      },
    });

    const hasMore = students.length > params.limit;
    return {
      students: hasMore ? students.slice(0, params.limit) : students,
      nextCursor: hasMore ? students[params.limit - 1].id : null,
    };
  }

  /**
   * Exact lookup by admission number — the identifier a student keeps from
   * registration to graduation. Case-insensitive so "gvps/2026/0001" typed on
   * a phone still finds them; exact rather than "contains", so 0001 never
   * returns 0010 as well.
   */
  async findByAdmissionNo(actor: AuthenticatedStaff, admissionNo: string) {
    const scope = await this.access.studentScope(actor);
    const student = await this.prisma.student.findFirst({
      where: {
        schoolId: actor.schoolId,
        admissionNo: { equals: admissionNo.trim(), mode: "insensitive" },
        AND: [AccessScopeService.studentWhere(scope)],
      },
      select: { id: true },
    });
    if (!student) throw new NotFoundException(`No student with admission number ${admissionNo.trim()}.`);
    return this.findOne(actor, student.id);
  }

  /**
   * One student's full record for the profile page. Out of scope reads as
   * not found rather than forbidden, so a teacher cannot probe ids to learn
   * which students exist in other classes.
   *
   * Siblings — other children of the same guardians — are listed only for
   * school-wide readers. For a teacher they would reveal names and classes
   * outside the teacher's own scope.
   */
  async findOne(actor: AuthenticatedStaff, studentId: string) {
    const scope = await this.access.studentScope(actor);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId: actor.schoolId, AND: [AccessScopeService.studentWhere(scope)] },
      include: {
        admittedIntoLevel: true,
        guardians: {
          orderBy: { isPrimary: "desc" },
          include: {
            guardian: {
              include: {
                students: {
                  where: { studentId: { not: studentId } },
                  include: {
                    student: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        enrolments: {
                          where: { status: EnrolmentStatus.ACTIVE },
                          take: 1,
                          select: { classArm: { select: { name: true, classLevel: { select: { name: true } } } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        enrolments: {
          orderBy: { session: { startDate: "desc" } },
          include: { classArm: { include: { classLevel: true } }, session: true },
        },
      },
    });
    if (!student) throw new NotFoundException("Student not found.");
    return withSiblings(student, scope.kind === "school");
  }
}
