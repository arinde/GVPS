import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { AssignClassSubjectsDto, AssignSubjectDto } from "@/subjects/subjects.schemas";

const TEACHING_ROLES: Role[] = [Role.SUBJECT_TEACHER, Role.FORM_TEACHER];

const fieldError = (path: string, message: string) => new BadRequestException([{ path: [path], message }]);
const armLabel = (arm: { name: string; classLevel: { name: string } }) => `${arm.classLevel.name}${arm.name}`;

/**
 * Who teaches which subject in which class, this session (FEATURES.md §2.4).
 * One teacher per subject per class: assigning a class that already has a
 * teacher for that subject replaces them, as class allocation does. Both
 * teaching models are served — a secondary teacher takes one subject across
 * many classes; a primary class teacher takes every subject in one class.
 * Superadmin-only at the controller; every change is audited.
 */
@Injectable()
export class SubjectAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** One teacher's subjects and classes this session. */
  async forStaff(schoolId: string, staffId: string) {
    const session = await this.currentSessionOrThrow(schoolId);
    return this.prisma.subjectAssignment.findMany({
      where: { schoolId, sessionId: session.id, staffId },
      orderBy: [{ subject: { name: "asc" } }, { classArm: { classLevel: { rank: "asc" } } }],
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classArm: { select: { id: true, name: true, classLevel: { select: { name: true } } } },
      },
    });
  }

  /** The classes a subject can be taught in — those at levels offering it — and who teaches each now. */
  async classesForSubject(schoolId: string, subjectId: string) {
    const session = await this.currentSessionOrThrow(schoolId);
    return this.prisma.classArm.findMany({
      where: { schoolId, classLevel: { offerings: { some: { subjectId } } } },
      orderBy: [{ classLevel: { rank: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        classLevel: { select: { name: true } },
        subjectAssignments: {
          where: { sessionId: session.id, subjectId },
          select: { staff: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }

  async assign(actor: AuthenticatedStaff, dto: AssignSubjectDto) {
    const session = await this.currentSessionOrThrow(actor.schoolId);
    const staff = await this.teacherOrThrow(actor.schoolId, dto.staffId);
    const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId: actor.schoolId } });
    if (!subject) throw fieldError("subjectId", "Choose a subject from the list");

    const arms = await this.prisma.classArm.findMany({
      where: {
        schoolId: actor.schoolId,
        id: { in: dto.classArmIds },
        classLevel: { offerings: { some: { subjectId: subject.id } } },
      },
      include: { classLevel: true },
    });
    if (arms.length !== dto.classArmIds.length) {
      throw fieldError("classArmIds", `Choose classes whose level offers ${subject.name}`);
    }

    await this.upsertAll(
      actor.schoolId,
      session.id,
      staff.id,
      arms.map((arm) => ({ armId: arm.id, subjectId: subject.id })),
    );
    await this.record(actor, "subject.teacher.assigned", staff.id, {
      subject: subject.name,
      classes: arms.map(armLabel),
      session: session.name,
    });
    return { assigned: arms.length };
  }

  /** Every subject offered at the class's level, to one teacher, in one action. */
  async assignWholeClass(actor: AuthenticatedStaff, dto: AssignClassSubjectsDto) {
    const session = await this.currentSessionOrThrow(actor.schoolId);
    const staff = await this.teacherOrThrow(actor.schoolId, dto.staffId);
    const arm = await this.prisma.classArm.findFirst({
      where: { id: dto.classArmId, schoolId: actor.schoolId },
      include: { classLevel: { include: { offerings: { include: { subject: true } } } } },
    });
    if (!arm) throw fieldError("classArmId", "Choose a class from the list");

    const subjects = [...new Map(arm.classLevel.offerings.map(({ subject }) => [subject.id, subject])).values()];
    if (subjects.length === 0) {
      throw fieldError("classArmId", `No subjects are offered at ${arm.classLevel.name} yet. Add them under Subjects.`);
    }

    await this.upsertAll(
      actor.schoolId,
      session.id,
      staff.id,
      subjects.map((subject) => ({ armId: arm.id, subjectId: subject.id })),
    );
    await this.record(actor, "subject.teacher.assigned", staff.id, {
      subject: "All subjects",
      classes: [armLabel(arm)],
      subjects: subjects.map((subject) => subject.name),
      session: session.name,
    });
    return { assigned: subjects.length };
  }

  async unassign(actor: AuthenticatedStaff, assignmentId: string) {
    const assignment = await this.prisma.subjectAssignment.findFirst({
      where: { id: assignmentId, schoolId: actor.schoolId },
      include: { subject: true, classArm: { include: { classLevel: true } } },
    });
    if (!assignment) throw new NotFoundException("Assignment not found.");
    await this.prisma.subjectAssignment.delete({ where: { id: assignmentId } });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "subject.teacher.removed",
      entityType: "Staff",
      entityId: assignment.staffId,
      before: { subject: assignment.subject.name, class: armLabel(assignment.classArm) },
    });
  }

  private upsertAll(
    schoolId: string,
    sessionId: string,
    staffId: string,
    pairs: { armId: string; subjectId: string }[],
  ) {
    return this.prisma.$transaction(
      pairs.map(({ armId, subjectId }) =>
        this.prisma.subjectAssignment.upsert({
          where: { sessionId_subjectId_classArmId: { sessionId, subjectId, classArmId: armId } },
          create: { schoolId, sessionId, subjectId, classArmId: armId, staffId },
          update: { staffId },
        }),
      ),
    );
  }

  private async teacherOrThrow(schoolId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id: staffId, schoolId }, include: { roles: true } });
    if (!staff) throw fieldError("staffId", "Staff member not found");
    if (!staff.roles.some(({ role }) => TEACHING_ROLES.includes(role))) {
      throw fieldError("staffId", "Give this staff member the Subject teacher or Form teacher role first");
    }
    return staff;
  }

  private async currentSessionOrThrow(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    if (!session) throw new BadRequestException("No current academic session is set.");
    return session;
  }

  private record(actor: AuthenticatedStaff, action: string, staffId: string, after: Record<string, unknown>) {
    return this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action,
      entityType: "Staff",
      entityId: staffId,
      after,
    });
  }
}
