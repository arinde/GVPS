import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, Section, type Prisma } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { PromoteDto } from "@/promotions/promotions.schemas";
import { admissionCodeFor, AdmissionNumberService } from "@/students/admission-number.service";
import { resolveStream } from "@/students/registration-rules";

const fieldError = (path: string, message: string) => new BadRequestException([{ path: [path], message }]);
const armLabel = (arm: { name: string; classLevel: { name: string } }) => `${arm.classLevel.name}${arm.name}`;
const SECONDARY: Section[] = [Section.JUNIOR, Section.SENIOR];

/**
 * End of year: moving a class into the next session (FEATURES.md §3.6).
 *
 * Promotion creates a new enrolment and never edits the old one (§3.4), so a
 * student's history stays readable year by year. Repeating is the same action
 * with the same level as the destination.
 *
 * Moving from primary into secondary issues a new admission number, as the
 * school asked (§3.1). The old number is archived, still finds the student in
 * a lookup, and the change is audited. This is the only path allowed to
 * change a number; the database trigger refuses every other one.
 */
@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly admissionNumbers: AdmissionNumberService,
  ) {}

  /** The students a class can promote: everyone enrolled in it this session. */
  async candidates(schoolId: string, classArmId: string) {
    const session = await this.currentSessionOrThrow(schoolId);
    const enrolments = await this.prisma.enrolment.findMany({
      where: { schoolId, classArmId, sessionId: session.id, status: EnrolmentStatus.ACTIVE },
      orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
      select: {
        id: true,
        stream: true,
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
    });

    return {
      session: { id: session.id, name: session.name },
      students: enrolments.map(({ student, stream }) => ({ ...student, stream })),
    };
  }

  async promote(actor: AuthenticatedStaff, dto: PromoteDto) {
    const { schoolId } = actor;
    const [from, to] = await Promise.all([
      this.armOrThrow(schoolId, dto.fromClassArmId, "fromClassArmId"),
      this.armOrThrow(schoolId, dto.toClassArmId, "toClassArmId"),
    ]);
    const toSession = await this.prisma.academicSession.findFirst({ where: { id: dto.toSessionId, schoolId } });
    if (!toSession) throw fieldError("toSessionId", "Choose a session from the list");

    const stream = resolveStream(to, dto.stream);
    const school = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
    const movingToSecondary = SECONDARY.includes(to.classLevel.section);
    const secondaryCode = admissionCodeFor(school, to.classLevel.section);

    const enrolments = await this.prisma.enrolment.findMany({
      where: { schoolId, classArmId: from.id, studentId: { in: dto.studentIds }, status: EnrolmentStatus.ACTIVE },
      include: { student: true },
    });
    if (enrolments.length !== dto.studentIds.length) {
      throw fieldError("studentIds", `Choose students currently in ${armLabel(from)}`);
    }

    const already = await this.prisma.enrolment.findMany({
      where: { sessionId: toSession.id, studentId: { in: dto.studentIds } },
      select: { studentId: true },
    });
    if (already.length) {
      throw fieldError("studentIds", `${already.length} of these students are already enrolled in ${toSession.name}`);
    }

    const moved: { name: string; from: string; to: string; oldNo?: string; newNo?: string }[] = [];

    for (const enrolment of enrolments) {
      const { student } = enrolment;
      const needsNewNumber = movingToSecondary && !student.admissionNo.includes(`/${secondaryCode}/`);

      const newNo = await this.prisma.$transaction(async (tx) => {
        await tx.enrolment.create({
          data: {
            schoolId,
            studentId: student.id,
            sessionId: toSession.id,
            classArmId: to.id,
            stream,
            status: EnrolmentStatus.ACTIVE,
          },
        });
        if (!needsNewNumber) return null;
        return this.reissueNumber(tx, schoolId, student, to.classLevel.section, toSession.startDate.getFullYear());
      });

      moved.push({
        name: `${student.lastName}, ${student.firstName}`,
        from: armLabel(from),
        to: armLabel(to),
        ...(newNo ? { oldNo: student.admissionNo, newNo } : {}),
      });
    }

    await this.audit.record({
      schoolId,
      actorStaffId: actor.id,
      action: "students.promoted",
      entityType: "ClassArm",
      entityId: to.id,
      after: {
        from: armLabel(from),
        to: armLabel(to),
        session: toSession.name,
        students: moved.length,
        reissued: moved.filter((entry) => entry.newNo).length,
        detail: moved,
      },
    });

    return { promoted: moved.length, reissued: moved.filter((entry) => entry.newNo).length, students: moved };
  }

  /**
   * Archives the old number and issues a secondary one. The flag is what the
   * immutability trigger checks; SET LOCAL keeps it to this transaction.
   */
  private async reissueNumber(
    tx: Prisma.TransactionClient,
    schoolId: string,
    student: { id: string; admissionNo: string },
    section: Section,
    year: number,
  ) {
    const school = await tx.school.findUniqueOrThrow({ where: { id: schoolId } });
    const admissionNo = await this.admissionNumbers.allocate(tx, school, section, year);

    await tx.admissionNumberHistory.create({
      data: { schoolId, studentId: student.id, admissionNo: student.admissionNo, reason: "Entered secondary school" },
    });
    await tx.$executeRawUnsafe("SET LOCAL gvps.reissue_admission_no = 'on'");
    await tx.student.update({ where: { id: student.id }, data: { admissionNo } });
    return admissionNo;
  }

  private async armOrThrow(schoolId: string, classArmId: string, path: string) {
    const arm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId },
      include: { classLevel: true },
    });
    if (!arm) throw fieldError(path, "Choose a class from the list");
    return arm;
  }

  private async currentSessionOrThrow(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    if (!session) throw new NotFoundException("No current academic session is set.");
    return session;
  }
}
