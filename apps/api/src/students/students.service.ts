import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  EnrolmentStatus,
  Section,
  type ClassArm,
  type ClassLevel,
  type Prisma,
  type Stream,
  type Student,
} from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AdmissionNumberService } from "@/students/admission-number.service";
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
  ) {}

  async register(actorStaffId: string, schoolId: string, dto: CreateStudentDto): Promise<Student> {
    const school = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

    const arm = await this.prisma.classArm.findFirst({
      where: { id: dto.classArmId, schoolId },
      include: { classLevel: true },
    });
    if (!arm) throw new NotFoundException("Class arm not found.");
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
  async search(schoolId: string, params: StudentSearch) {
    const query = params.query?.trim();

    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
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
  async findByAdmissionNo(schoolId: string, admissionNo: string) {
    const student = await this.prisma.student.findFirst({
      where: { schoolId, admissionNo: { equals: admissionNo.trim(), mode: "insensitive" } },
      select: { id: true },
    });
    if (!student) throw new NotFoundException(`No student with admission number ${admissionNo.trim()}.`);
    return this.findOne(schoolId, student.id);
  }

  async findOne(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        admittedIntoLevel: true,
        guardians: { include: { guardian: true } },
        enrolments: { include: { classArm: { include: { classLevel: true } }, session: true } },
      },
    });
    if (!student) throw new NotFoundException("Student not found.");
    return student;
  }
}

/**
 * The department to record on the enrolment (see Enrolment.stream).
 *
 * Senior arms need one; everything else must not have one. If the arm itself
 * is tagged with a stream, that decides it, and a conflicting choice is an
 * error rather than silently overridden. Errors use the validation pipe's
 * { path, message } shape so the form highlights the department field.
 */
export function resolveStream(arm: ClassArm & { classLevel: ClassLevel }, requested?: Stream): Stream | null {
  const fieldError = (message: string) => new BadRequestException([{ path: ["stream"], message }]);

  if (arm.classLevel.section !== Section.SENIOR) {
    if (requested) throw fieldError(`${arm.classLevel.name} students do not have a department`);
    return null;
  }
  if (arm.stream) {
    if (requested && requested !== arm.stream) {
      throw fieldError(`${arm.classLevel.name}${arm.name} is a ${arm.stream.toLowerCase()} class`);
    }
    return arm.stream;
  }
  if (!requested) throw fieldError("Choose a department for a senior student");
  return requested;
}

/**
 * Exactly one guardian is the primary contact. If none was marked, the first
 * one is — the office always needs someone to ring first (FEATURES.md §3.3).
 */
export function withOnePrimary(guardians: GuardianInputDto[]): GuardianInputDto[] {
  if (guardians.some((guardian) => guardian.isPrimary)) return guardians;
  return guardians.map((guardian, index) => ({ ...guardian, isPrimary: index === 0 }));
}
