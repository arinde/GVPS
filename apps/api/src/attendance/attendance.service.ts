import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceStatus, EnrolmentStatus, Role } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { MarkAttendanceBatchDto } from "@/attendance/schemas/attendance.schema";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

const WRITERS: Role[] = [Role.SUPERADMIN];

/** "Present" or "late" both count toward a day actually attended (FEATURES.md §4.3); excused and absent don't. */
const ATTENDED: AttendanceStatus[] = [AttendanceStatus.PRESENT, AttendanceStatus.LATE];

/**
 * FEATURES.md §4 — daily attendance (Primary/Junior, one mark a day, by the
 * form teacher) and period attendance (Senior, one mark a period, by the
 * subject teacher; optional per school policy — nothing here forces either
 * section into one mode, since a school's own policy decides that). Scoped
 * the same way score entry is: a teacher may only mark their own arm or
 * their own subject × arm assignment; superadmin may mark or correct any.
 */
@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** The arm's actively-enrolled students and whatever's already marked for that day. */
  async getDaily(actor: AuthenticatedStaff, classArmId: string, date: string) {
    const { term } = await this.assertDailyAccess(actor, classArmId);
    const [students, marks] = await this.studentsAndMarks(actor.schoolId, classArmId, term.sessionId, date, null);
    return { students, marks };
  }

  async markDaily(actor: AuthenticatedStaff, classArmId: string, dto: MarkAttendanceBatchDto) {
    const { term } = await this.assertDailyAccess(actor, classArmId);
    await this.saveMarks(actor, term, classArmId, dto, null, null);
  }

  /** The arm's actively-enrolled students and whatever's already marked for that subject's period that day. */
  async getPeriod(actor: AuthenticatedStaff, classArmId: string, periodId: string, subjectId: string, date: string) {
    const { term } = await this.assertPeriodAccess(actor, classArmId, subjectId);
    const [students, marks] = await this.studentsAndMarks(actor.schoolId, classArmId, term.sessionId, date, periodId);
    return { students, marks };
  }

  async markPeriod(
    actor: AuthenticatedStaff,
    classArmId: string,
    periodId: string,
    subjectId: string,
    dto: MarkAttendanceBatchDto,
  ) {
    const { term } = await this.assertPeriodAccess(actor, classArmId, subjectId);
    const period = await this.prisma.period.findFirst({ where: { id: periodId, schoolId: actor.schoolId } });
    if (!period) throw new NotFoundException("Period not found.");
    await this.saveMarks(actor, term, classArmId, dto, periodId, subjectId);
  }

  /** Days actually attended against the term's own "times school opened" — the report card's standard field. */
  async studentSummary(actor: AuthenticatedStaff, studentId: string, termId: string) {
    this.assertReader(actor);
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");

    const records = await this.prisma.attendance.findMany({
      where: { schoolId: actor.schoolId, termId, studentId },
      select: { date: true, status: true },
    });
    const presentDates = new Set(
      records.filter((record) => ATTENDED.includes(record.status)).map((record) => record.date.toISOString()),
    );
    return { timesPresent: presentDates.size, timesSchoolOpened: term.timesSchoolOpened };
  }

  private async studentsAndMarks(
    schoolId: string,
    classArmId: string,
    sessionId: string,
    date: string,
    periodId: string | null,
  ) {
    const [enrolments, marks] = await Promise.all([
      this.prisma.enrolment.findMany({
        where: { schoolId, classArmId, sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
      this.prisma.attendance.findMany({
        where: { schoolId, classArmId, date: new Date(date), periodId },
      }),
    ]);
    return [enrolments.map((enrolment) => enrolment.student), marks] as const;
  }

  private async saveMarks(
    actor: AuthenticatedStaff,
    term: { id: string; sessionId: string },
    classArmId: string,
    dto: MarkAttendanceBatchDto,
    periodId: string | null,
    subjectId: string | null,
  ) {
    const enrolled = await this.prisma.enrolment.findMany({
      where: {
        schoolId: actor.schoolId,
        classArmId,
        sessionId: term.sessionId,
        status: EnrolmentStatus.ACTIVE,
        studentId: { in: dto.marks.map((mark) => mark.studentId) },
      },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrolled.map((enrolment) => enrolment.studentId));
    const unknown = dto.marks.find((mark) => !enrolledIds.has(mark.studentId));
    if (unknown) {
      throw new BadRequestException([{ path: ["studentId"], message: "Student is not enrolled in this class." }]);
    }

    // Prisma's generated compound-unique input won't accept null for a
    // nullable key part (periodId, for daily marking) — a plain findFirst
    // plus create/update sidesteps that rather than fighting the typing.
    const date = new Date(dto.date);
    const existing = await this.prisma.attendance.findMany({
      where: {
        schoolId: actor.schoolId,
        classArmId,
        date,
        periodId,
        studentId: { in: enrolled.map((e) => e.studentId) },
      },
      select: { id: true, studentId: true },
    });
    const existingByStudent = new Map(existing.map((record) => [record.studentId, record.id]));

    await this.prisma.$transaction(
      dto.marks.map((mark) => {
        const existingId = existingByStudent.get(mark.studentId);
        return existingId
          ? this.prisma.attendance.update({
              where: { id: existingId },
              data: { status: mark.status, markedByStaffId: actor.id },
            })
          : this.prisma.attendance.create({
              data: {
                schoolId: actor.schoolId,
                sessionId: term.sessionId,
                termId: term.id,
                classArmId,
                studentId: mark.studentId,
                date,
                status: mark.status,
                periodId,
                subjectId,
                markedByStaffId: actor.id,
              },
            });
      }),
    );

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: periodId ? "attendance.period.marked" : "attendance.daily.marked",
      entityType: "ClassArm",
      entityId: classArmId,
      after: { date: dto.date, periodId, subjectId, count: dto.marks.length },
    });
  }

  private assertReader(actor: AuthenticatedStaff) {
    if (actor.roles.includes(Role.BURSAR)) throw new ForbiddenException("You do not have access to attendance.");
  }

  /** Superadmin, or the arm's own form teacher this session. */
  private async assertDailyAccess(actor: AuthenticatedStaff, classArmId: string) {
    const term = await this.currentTermOrThrow(actor.schoolId);
    if (!actor.roles.some((role) => WRITERS.includes(role))) {
      if (!actor.roles.includes(Role.FORM_TEACHER)) {
        throw new ForbiddenException("Only this class's form teacher, or the superadmin, can mark its attendance.");
      }
      const assignment = await this.prisma.classAssignment.findUnique({
        where: { sessionId_classArmId: { sessionId: term.sessionId, classArmId } },
        select: { staffId: true },
      });
      if (assignment?.staffId !== actor.id) {
        throw new ForbiddenException("Only this class's form teacher, or the superadmin, can mark its attendance.");
      }
    }
    return { term };
  }

  /** Superadmin, or the teacher assigned to this subject × arm this session. */
  private async assertPeriodAccess(actor: AuthenticatedStaff, classArmId: string, subjectId: string) {
    const term = await this.currentTermOrThrow(actor.schoolId);
    if (!actor.roles.some((role) => WRITERS.includes(role))) {
      const assignment = await this.prisma.subjectAssignment.findFirst({
        where: { schoolId: actor.schoolId, sessionId: term.sessionId, subjectId, classArmId, staffId: actor.id },
      });
      if (!assignment) throw new ForbiddenException("You are not assigned to teach this subject in this class.");
    }
    return { term };
  }

  private async currentTermOrThrow(schoolId: string) {
    const term = await this.prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
    if (!term) throw new BadRequestException("No current term is set.");
    return term;
  }
}
