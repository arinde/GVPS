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
 * FEATURES.md §8.1 — the arm-by-arm grid, its single-cell editor, and the
 * per-teacher view. The class's subject list and the auto-generator that
 * reads it live in TimetableSubjectsService instead — split out to keep
 * this file under the 400-line hard cap (AGENTS.md §7).
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

    const [subjects, staff, loads] = await Promise.all([
      this.prisma.subject.findMany({ where: { id: { in: slots.map((slot) => slot.subjectId) } } }),
      this.prisma.staff.findMany({
        where: { id: { in: slots.flatMap((slot) => (slot.staffId ? [slot.staffId] : [])) } },
      }),
      this.prisma.classSubjectLoad.findMany({ where: { schoolId, sessionId, classArmId } }),
    ]);
    const subjectName = new Map(subjects.map((subject) => [subject.id, subject.name]));
    const staffName = new Map(staff.map((member) => [member.id, staffLabel(member)]));
    // A subject pinned to one day (Sports every Wednesday) is a fixture, not a regular
    // lesson — the UI styles it differently, hence exposing it per slot here.
    const fixedDayBySubject = new Map(loads.map((load) => [load.subjectId, load.fixedDay]));

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
        staffName: slot.staffId ? (staffName.get(slot.staffId) ?? "—") : "No teacher assigned yet",
        fixedDay: fixedDayBySubject.get(slot.subjectId) ?? null,
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
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);
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

    const newSubject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId: actor.schoolId } });
    if (!newSubject) throw new NotFoundException("Subject not found.");

    // A slot can hold more than one subject only when they're the same
    // elective combo (different students, different combo rooms, same
    // period). Setting a lesson by hand otherwise still replaces whatever
    // was there, same as before this could happen at all.
    const existing = await this.prisma.timetableSlot.findMany({
      where: { schoolId: actor.schoolId, sessionId, classArmId, dayOfWeek, periodId },
    });
    const existingSubjects = await this.prisma.subject.findMany({
      where: { id: { in: existing.map((slot) => slot.subjectId) } },
      select: { id: true, comboGroup: true },
    });
    const comboGroupBySubjectId = new Map(existingSubjects.map((subject) => [subject.id, subject.comboGroup]));
    const othersToClear = existing.filter(
      (slot) =>
        slot.subjectId !== dto.subjectId &&
        !(newSubject.comboGroup && comboGroupBySubjectId.get(slot.subjectId) === newSubject.comboGroup),
    );
    if (othersToClear.length > 0) {
      await this.prisma.timetableSlot.deleteMany({ where: { id: { in: othersToClear.map((slot) => slot.id) } } });
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
      where: { classArmId_dayOfWeek_periodId_subjectId: { classArmId, dayOfWeek, periodId, subjectId: dto.subjectId } },
      create: {
        schoolId: actor.schoolId,
        sessionId,
        classArmId,
        dayOfWeek,
        periodId,
        subjectId: dto.subjectId,
        staffId: assignment.staffId,
      },
      update: { staffId: assignment.staffId },
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
    await assertWriterOrOwnFormTeacher(this.prisma, actor, slot.sessionId, slot.classArmId);
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
}

export function staffLabel(staff: { firstName: string | null; lastName: string | null; email: string }): string {
  return staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : staff.email;
}

/**
 * FEATURES.md §14 "Timetable" row, extended at the owner's request: a class's
 * own form teacher may also manage its subject list, periods-per-week, and
 * timetable — not just the whole-school writer roles. Shared with
 * TimetableSubjectsService, which needs the identical check.
 */
export async function assertWriterOrOwnFormTeacher(
  prisma: PrismaService,
  actor: AuthenticatedStaff,
  sessionId: string,
  classArmId: string,
): Promise<void> {
  if (actor.roles.some((role) => WRITERS.includes(role))) return;
  if (actor.roles.includes(Role.FORM_TEACHER)) {
    const assignment = await prisma.classAssignment.findUnique({
      where: { sessionId_classArmId: { sessionId, classArmId } },
      select: { staffId: true },
    });
    if (assignment?.staffId === actor.id) return;
  }
  throw new ForbiddenException(
    "Only this class's form teacher, or the superadmin, principal or admin office, can change its timetable.",
  );
}
