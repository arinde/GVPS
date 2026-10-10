import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DayOfWeek, Role } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import { planTimetable } from "@/timetable/auto-generate";
import type { SetSlotDto } from "@/timetable/schemas/timetable.schema";

export const WRITERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY];
export const DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

/**
 * FEATURES.md §8.1 — the arm-by-arm builder and the per-teacher view. A
 * subject has exactly one teacher per arm per session (SubjectAssignment's
 * own unique constraint), so a cell only ever needs a subject: the teacher
 * comes from that assignment, which also means a subject with nobody
 * assigned to teach it in that class simply cannot be timetabled.
 */
@Injectable()
export class TimetableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async armGrid(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    this.assertReader(actor);
    return this.buildArmGrid(actor.schoolId, sessionId, classArmId);
  }

  /** Shared with the parent portal, which does its own ward check before calling this. */
  async buildArmGrid(schoolId: string, sessionId: string, classArmId: string) {
    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId },
      include: { classLevel: true },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const [periods, slots] = await Promise.all([
      this.prisma.period.findMany({
        where: { schoolId, section: classArm.classLevel.section },
        orderBy: { sequence: "asc" },
      }),
      this.prisma.timetableSlot.findMany({ where: { schoolId, sessionId, classArmId } }),
    ]);

    const [subjects, staff] = await Promise.all([
      this.prisma.subject.findMany({ where: { id: { in: slots.map((slot) => slot.subjectId) } } }),
      this.prisma.staff.findMany({ where: { id: { in: slots.map((slot) => slot.staffId) } } }),
    ]);
    const subjectName = new Map(subjects.map((subject) => [subject.id, subject.name]));
    const staffName = new Map(staff.map((member) => [member.id, staffLabel(member)]));

    return {
      classLabel: `${classArm.classLevel.name}${classArm.name}`,
      days: DAYS,
      periods,
      slots: slots.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        periodId: slot.periodId,
        subjectId: slot.subjectId,
        subjectName: subjectName.get(slot.subjectId) ?? "—",
        staffId: slot.staffId,
        staffName: staffName.get(slot.staffId) ?? "—",
      })),
    };
  }

  /** The subjects this arm actually has a teacher for this session, and how many periods each needs this week. */
  async availableSubjects(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    await this.assertWriterOrOwnFormTeacher(actor, sessionId, classArmId);
    const assignments = await this.prisma.subjectAssignment.findMany({
      where: { schoolId: actor.schoolId, sessionId, classArmId },
      include: { subject: { select: { name: true } }, staff: true },
      orderBy: { subject: { name: "asc" } },
    });
    return assignments.map((assignment) => ({
      subjectId: assignment.subjectId,
      subjectName: assignment.subject.name,
      staffName: staffLabel(assignment.staff),
      periodsPerWeek: assignment.periodsPerWeek,
      fixedDay: assignment.fixedDay,
    }));
  }

  /**
   * How much of the week this class's subject needs, and optionally which
   * single day it's pinned to (Sports every Wednesday) — the input the
   * auto-generator reads.
   */
  async setSubjectLoad(
    actor: AuthenticatedStaff,
    sessionId: string,
    classArmId: string,
    subjectId: string,
    periodsPerWeek: number,
    fixedDay: DayOfWeek | null,
  ) {
    await this.assertWriterOrOwnFormTeacher(actor, sessionId, classArmId);
    const assignment = await this.prisma.subjectAssignment.findFirst({
      where: { schoolId: actor.schoolId, sessionId, classArmId, subjectId },
    });
    if (!assignment) throw new NotFoundException("This subject is not assigned to this class.");
    return this.prisma.subjectAssignment.update({
      where: { id: assignment.id },
      data: { periodsPerWeek, fixedDay },
    });
  }

  /**
   * Builds the whole week from the class's subject list in one go, instead of
   * a cell at a time. Replaces whatever this class's timetable currently
   * holds — a manual touch-up after this runs is fine, but running it again
   * starts over.
   */
  async autoGenerate(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    await this.assertWriterOrOwnFormTeacher(actor, sessionId, classArmId);

    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const [periods, loads, otherSlots] = await Promise.all([
      this.prisma.period.findMany({
        where: { schoolId: actor.schoolId, section: classArm.classLevel.section, isTeaching: true },
        orderBy: { sequence: "asc" },
      }),
      this.prisma.subjectAssignment.findMany({ where: { schoolId: actor.schoolId, sessionId, classArmId } }),
      this.prisma.timetableSlot.findMany({
        where: { schoolId: actor.schoolId, sessionId, classArmId: { not: classArmId } },
        select: { staffId: true, dayOfWeek: true, periodId: true },
      }),
    ]);
    if (periods.length === 0) {
      throw new BadRequestException("No teaching periods are defined for this section yet. Add periods first.");
    }
    if (loads.length === 0) {
      throw new BadRequestException(
        "This class has no subjects assigned yet. Assign subjects and set how many periods each needs first.",
      );
    }

    const busyElsewhere = new Set(otherSlots.map((slot) => `${slot.staffId}|${slot.dayOfWeek}|${slot.periodId}`));
    const { placed, unplaced } = planTimetable({
      days: DAYS,
      periods: periods.map((period) => ({ id: period.id, sequence: period.sequence })),
      loads: loads.map((load) => ({
        subjectId: load.subjectId,
        staffId: load.staffId,
        periodsPerWeek: load.periodsPerWeek,
        fixedDay: load.fixedDay,
      })),
      busyElsewhere,
    });

    await this.prisma.$transaction([
      this.prisma.timetableSlot.deleteMany({ where: { schoolId: actor.schoolId, sessionId, classArmId } }),
      this.prisma.timetableSlot.createMany({
        data: placed.map((slot) => ({
          schoolId: actor.schoolId,
          sessionId,
          classArmId,
          dayOfWeek: slot.day,
          periodId: slot.periodId,
          subjectId: slot.subjectId,
          staffId: slot.staffId,
        })),
      }),
    ]);
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "timetable.autoGenerated",
      entityType: "ClassArm",
      entityId: classArmId,
      after: { sessionId, placed: placed.length, unplaced },
    });

    const subjectIds = [...new Set(unplaced.map((item) => item.subjectId))];
    const subjects = subjectIds.length ? await this.prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : [];
    const subjectName = new Map(subjects.map((subject) => [subject.id, subject.name]));

    return {
      placed: placed.length,
      unplaced: unplaced.map((item) => ({
        subjectId: item.subjectId,
        subjectName: subjectName.get(item.subjectId) ?? "—",
        missing: item.missing,
      })),
    };
  }

  async setSlot(
    actor: AuthenticatedStaff,
    sessionId: string,
    classArmId: string,
    dayOfWeek: DayOfWeek,
    periodId: string,
    dto: SetSlotDto,
  ) {
    await this.assertWriterOrOwnFormTeacher(actor, sessionId, classArmId);
    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const period = await this.prisma.period.findFirst({ where: { id: periodId, schoolId: actor.schoolId } });
    if (!period) throw new NotFoundException("Period not found.");
    if (period.section !== classArm.classLevel.section) {
      throw new BadRequestException("This period belongs to a different section.");
    }
    if (!period.isTeaching) throw new BadRequestException("This period is a break or assembly, not a teaching slot.");

    const assignment = await this.prisma.subjectAssignment.findFirst({
      where: { schoolId: actor.schoolId, sessionId, classArmId, subjectId: dto.subjectId },
    });
    if (!assignment) {
      throw new BadRequestException(
        "No teacher is assigned to teach this subject in this class yet. Assign one under Subject assignments first.",
      );
    }

    const clash = await this.prisma.timetableSlot.findFirst({
      where: {
        schoolId: actor.schoolId,
        sessionId,
        dayOfWeek,
        periodId,
        staffId: assignment.staffId,
        classArmId: { not: classArmId },
      },
    });
    if (clash) {
      const [clashingArm, teacher] = await Promise.all([
        this.prisma.classArm.findUnique({ where: { id: clash.classArmId }, include: { classLevel: true } }),
        this.prisma.staff.findUnique({ where: { id: assignment.staffId } }),
      ]);
      const armLabel = clashingArm ? `${clashingArm.classLevel.name}${clashingArm.name}` : "another class";
      throw new ConflictException(
        `${teacher ? staffLabel(teacher) : "This teacher"} already teaches ${armLabel} at this period.`,
      );
    }

    const slot = await this.prisma.timetableSlot.upsert({
      where: { classArmId_dayOfWeek_periodId: { classArmId, dayOfWeek, periodId } },
      create: {
        schoolId: actor.schoolId,
        sessionId,
        classArmId,
        dayOfWeek,
        periodId,
        subjectId: dto.subjectId,
        staffId: assignment.staffId,
      },
      update: { subjectId: dto.subjectId, staffId: assignment.staffId },
    });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "timetable.slot.set",
      entityType: "TimetableSlot",
      entityId: slot.id,
      after: { classArmId, dayOfWeek, periodId, subjectId: dto.subjectId, staffId: assignment.staffId },
    });
    return slot;
  }

  async clearSlot(actor: AuthenticatedStaff, slotId: string): Promise<void> {
    const slot = await this.prisma.timetableSlot.findFirst({ where: { id: slotId, schoolId: actor.schoolId } });
    if (!slot) throw new NotFoundException("Lesson not found.");
    await this.assertWriterOrOwnFormTeacher(actor, slot.sessionId, slot.classArmId);
    await this.prisma.timetableSlot.delete({ where: { id: slotId } });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "timetable.slot.cleared",
      entityType: "TimetableSlot",
      entityId: slotId,
      before: { classArmId: slot.classArmId, dayOfWeek: slot.dayOfWeek, periodId: slot.periodId },
    });
  }

  /** One teacher's whole week, grouped by section (a teacher can appear in more than one). Free periods are the gaps. */
  async staffTimetable(actor: AuthenticatedStaff, sessionId: string, staffId: string) {
    this.assertReader(actor);
    const slots = await this.prisma.timetableSlot.findMany({ where: { schoolId: actor.schoolId, sessionId, staffId } });
    if (slots.length === 0) return { sections: [] };

    const arms = await this.prisma.classArm.findMany({
      where: { id: { in: [...new Set(slots.map((slot) => slot.classArmId))] } },
      include: { classLevel: true },
    });
    const armById = new Map(arms.map((arm) => [arm.id, arm]));
    const subjects = await this.prisma.subject.findMany({ where: { id: { in: slots.map((slot) => slot.subjectId) } } });
    const subjectName = new Map(subjects.map((subject) => [subject.id, subject.name]));

    const bySection = new Map<string, typeof slots>();
    for (const slot of slots) {
      const section = armById.get(slot.classArmId)?.classLevel.section;
      if (!section) continue;
      const list = bySection.get(section) ?? [];
      list.push(slot);
      bySection.set(section, list);
    }

    const sections = await Promise.all(
      [...bySection.entries()].map(async ([section, sectionSlots]) => {
        const periods = await this.prisma.period.findMany({
          where: { schoolId: actor.schoolId, section: section as never },
          orderBy: { sequence: "asc" },
        });
        return {
          section,
          days: DAYS,
          periods,
          slots: sectionSlots.map((slot) => {
            const arm = armById.get(slot.classArmId);
            return {
              dayOfWeek: slot.dayOfWeek,
              periodId: slot.periodId,
              classLabel: arm ? `${arm.classLevel.name}${arm.name}` : "—",
              subjectName: subjectName.get(slot.subjectId) ?? "—",
            };
          }),
        };
      }),
    );
    return { sections };
  }

  private assertReader(actor: AuthenticatedStaff) {
    if (actor.roles.includes(Role.BURSAR)) throw new ForbiddenException("You do not have access to the timetable.");
  }

  /**
   * FEATURES.md §14 "Timetable" row, extended at the owner's request: a class's
   * own form teacher may also manage its subject list, periods-per-week, and
   * timetable — not just the whole-school writer roles.
   */
  private async assertWriterOrOwnFormTeacher(
    actor: AuthenticatedStaff,
    sessionId: string,
    classArmId: string,
  ): Promise<void> {
    if (actor.roles.some((role) => WRITERS.includes(role))) return;
    if (actor.roles.includes(Role.FORM_TEACHER)) {
      const assignment = await this.prisma.classAssignment.findUnique({
        where: { sessionId_classArmId: { sessionId, classArmId } },
        select: { staffId: true },
      });
      if (assignment?.staffId === actor.id) return;
    }
    throw new ForbiddenException(
      "Only this class's form teacher, or the superadmin, principal or admin office, can change its timetable.",
    );
  }
}

function staffLabel(staff: { firstName: string | null; lastName: string | null; email: string }): string {
  return staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : staff.email;
}
