import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, type ClassAssignment } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * The school's policy: a teacher takes charge of one or two classes. A
 * constant rather than a database rule, because policies change — raise it
 * here and nothing else moves.
 */
export const MAX_CLASSES_PER_TEACHER = 2;

const fieldError = (message: string) => new BadRequestException([{ path: ["staffId"], message }]);

const armLabel = (arm: { name: string; classLevel: { name: string } }) => `${arm.classLevel.name}${arm.name}`;

/**
 * Class allocation (FEATURES.md §2.4): which teacher is in charge of which
 * class this session. These rows are what AccessScopeService reads, so an
 * allocation made here is exactly what widens a teacher's access.
 *
 * Superadmin-only at the controller — allocation grants access to children's
 * records, which makes it a privilege decision (PLAN.md §4.12), not clerical
 * work.
 */
@Injectable()
export class ClassAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Every class, with its teacher this session if it has one. */
  async listForCurrentSession(schoolId: string) {
    const session = await this.currentSessionOrThrow(schoolId);

    const arms = await this.prisma.classArm.findMany({
      where: { schoolId },
      orderBy: [{ classLevel: { rank: "asc" } }, { name: "asc" }],
      include: {
        classLevel: true,
        assignments: {
          where: { sessionId: session.id },
          include: { staff: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });

    return {
      session: { id: session.id, name: session.name },
      maxClassesPerTeacher: MAX_CLASSES_PER_TEACHER,
      classes: arms.map(({ assignments, ...arm }) => ({ ...arm, teacher: assignments[0]?.staff ?? null })),
    };
  }

  /**
   * Puts `staffId` in charge of the class for the current session, replacing
   * whoever held it, or leaves the class without a teacher when `staffId` is
   * null. Setting the teacher a class already has changes nothing.
   */
  async setClassTeacher(
    actorStaffId: string,
    schoolId: string,
    classArmId: string,
    staffId: string | null,
  ): Promise<ClassAssignment | null> {
    const session = await this.currentSessionOrThrow(schoolId);

    const arm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId },
      include: { classLevel: true },
    });
    if (!arm) throw new NotFoundException("Class not found.");

    const existing = await this.prisma.classAssignment.findUnique({
      where: { sessionId_classArmId: { sessionId: session.id, classArmId } },
    });
    if (existing?.staffId === staffId) return existing;

    if (staffId) await this.assertCanTakeClass(schoolId, session.id, classArmId, staffId);

    const assignment = await this.prisma.$transaction(async (tx) => {
      if (existing) await tx.classAssignment.delete({ where: { id: existing.id } });
      if (!staffId) return null;
      return tx.classAssignment.create({ data: { schoolId, sessionId: session.id, classArmId, staffId } });
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: staffId ? "class.teacher.set" : "class.teacher.cleared",
      entityType: "ClassArm",
      entityId: classArmId,
      before: { staffId: existing?.staffId ?? null },
      after: { staffId, class: armLabel(arm), session: session.name },
    });

    return assignment;
  }

  /** Must be a form teacher in this school, under the per-teacher limit. */
  private async assertCanTakeClass(schoolId: string, sessionId: string, classArmId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, schoolId },
      include: { roles: true },
    });
    if (!staff) throw fieldError("That staff member was not found.");

    const name = [staff.firstName, staff.lastName].filter(Boolean).join(" ") || staff.email;
    if (!staff.roles.some((grant) => grant.role === Role.FORM_TEACHER)) {
      throw fieldError(`${name} is not a form teacher. Give them the Form teacher role first.`);
    }

    // Classes they already hold, not counting this one — reassigning a class
    // to its own teacher is not a new class for them.
    const held = await this.prisma.classAssignment.findMany({
      where: { schoolId, sessionId, staffId, classArmId: { not: classArmId } },
      include: { classArm: { include: { classLevel: true } } },
    });
    if (held.length >= MAX_CLASSES_PER_TEACHER) {
      const classes = held.map((assignment) => armLabel(assignment.classArm)).join(" and ");
      throw fieldError(
        `${name} already has ${held.length} classes (${classes}). Free one first — the limit is ${MAX_CLASSES_PER_TEACHER}.`,
      );
    }
  }

  private async currentSessionOrThrow(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    if (!session) throw new BadRequestException("No current academic session is set, so classes cannot be allocated.");
    return session;
  }
}
