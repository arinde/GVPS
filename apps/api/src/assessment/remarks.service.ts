import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, Prisma, Role } from "@prisma/client";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { TRAIT_GROUPS } from "@/assessment/report-card";
import type { RemarkDto } from "@/assessment/schemas/remark.schema";
import { PrismaService } from "@/prisma/prisma.service";

const WHOLE_SCHOOL: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL];

/**
 * FEATURES.md §5.6–5.7 — the form teacher writes the form comment and traits,
 * the principal writes the principal's comment. Locked for a student once
 * their report card is published, so a card can never change underneath
 * someone who already has it.
 */
@Injectable()
export class RemarksService {
  constructor(private readonly prisma: PrismaService) {}

  async listForArm(actor: AuthenticatedStaff, termId: string, classArmId: string) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");
    if (!this.isWholeSchool(actor)) {
      await this.assertFormTeacher(actor, term.sessionId, classArmId);
    }

    const [enrolments, remarks, cards] = await Promise.all([
      this.prisma.enrolment.findMany({
        where: { schoolId: actor.schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
      this.prisma.studentRemark.findMany({ where: { schoolId: actor.schoolId, termId, classArmId } }),
      this.prisma.reportCard.findMany({
        where: { schoolId: actor.schoolId, termId, classArmId },
        select: { studentId: true },
      }),
    ]);
    const published = new Set(cards.map((card) => card.studentId));

    return {
      traitGroups: TRAIT_GROUPS,
      students: enrolments.map(({ student }) => {
        const remark = remarks.find((candidate) => candidate.studentId === student.id);
        return {
          studentId: student.id,
          name: `${student.lastName}, ${student.firstName}`,
          admissionNo: student.admissionNo,
          formComment: remark?.formComment ?? null,
          principalComment: remark?.principalComment ?? null,
          traits: remark?.traits ?? null,
          locked: published.has(student.id),
        };
      }),
    };
  }

  async save(actor: AuthenticatedStaff, termId: string, studentId: string, dto: RemarkDto) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");

    const enrolment = await this.prisma.enrolment.findFirst({
      where: { schoolId: actor.schoolId, studentId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
      select: { classArmId: true },
    });
    if (!enrolment) throw new NotFoundException("This student is not enrolled in the current session.");

    const published = await this.prisma.reportCard.findUnique({
      where: { termId_studentId: { termId, studentId } },
      select: { id: true },
    });
    if (published) throw new ConflictException("This report card is published and can no longer be changed.");

    const writesFormSide = dto.formComment !== undefined || dto.traits !== undefined;
    const writesPrincipalSide = dto.principalComment !== undefined;
    if (writesPrincipalSide && !this.isWholeSchool(actor)) {
      throw new ForbiddenException("Only the principal or superadmin writes the principal's comment.");
    }
    if (writesFormSide && !this.isWholeSchool(actor)) {
      await this.assertFormTeacher(actor, term.sessionId, enrolment.classArmId);
    }

    const data = {
      ...(dto.formComment !== undefined ? { formComment: dto.formComment } : {}),
      ...(dto.principalComment !== undefined ? { principalComment: dto.principalComment } : {}),
      ...(dto.traits !== undefined ? { traits: dto.traits ?? Prisma.DbNull } : {}),
    };
    return this.prisma.studentRemark.upsert({
      where: { termId_studentId: { termId, studentId } },
      create: { schoolId: actor.schoolId, termId, studentId, classArmId: enrolment.classArmId, ...data },
      update: data,
    });
  }

  private isWholeSchool(actor: AuthenticatedStaff): boolean {
    return actor.roles.some((role) => WHOLE_SCHOOL.includes(role));
  }

  private async assertFormTeacher(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    const assignment = await this.prisma.classAssignment.findUnique({
      where: { sessionId_classArmId: { sessionId, classArmId } },
      select: { staffId: true },
    });
    if (assignment?.staffId !== actor.id) {
      throw new ForbiddenException("Only this class's form teacher can write these remarks.");
    }
  }
}
