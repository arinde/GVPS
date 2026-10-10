import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DayOfWeek, type Stream } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import { planTimetable } from "@/timetable/auto-generate";
import { distributePeriods } from "@/timetable/default-periods-per-week";
import { assertWriterOrOwnFormTeacher, staffLabel, DAYS } from "@/timetable/timetable.service";

/**
 * FEATURES.md §8.1 — a class's subject list (ClassSubjectLoad), kept separate
 * from who teaches each subject (SubjectAssignment, still exactly one
 * teacher per arm per session): a subject can be added — and its weekly
 * load set — before a teacher exists. The owner wants the draft timetable
 * generated regardless of staffing, so the generator places a subject with
 * no teacher yet too — just with no teacher-clash check — and the class can
 * be redrafted once one is assigned, to pick up that check. Split out of
 * TimetableService to keep both files under the 400-line hard cap
 * (AGENTS.md §7).
 */
@Injectable()
export class TimetableSubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** This class's subject list this session, with whoever teaches each one — null until someone is assigned. */
  async availableSubjects(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);
    const [loads, assignments] = await Promise.all([
      this.prisma.classSubjectLoad.findMany({
        where: { schoolId: actor.schoolId, sessionId, classArmId },
        include: { subject: { select: { name: true } } },
        orderBy: { subject: { name: "asc" } },
      }),
      this.prisma.subjectAssignment.findMany({
        where: { schoolId: actor.schoolId, sessionId, classArmId },
        include: { staff: true },
      }),
    ]);
    const teacherBySubject = new Map(assignments.map((a) => [a.subjectId, staffLabel(a.staff)]));
    return loads.map((load) => ({
      subjectId: load.subjectId,
      subjectName: load.subject.name,
      staffName: teacherBySubject.get(load.subjectId) ?? null,
      periodsPerWeek: load.periodsPerWeek,
      fixedDay: load.fixedDay,
    }));
  }

  /** Subjects this class's level offers *to its own department*, that aren't on its list yet — the "add a subject" picker. */
  async addableSubjects(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);
    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: { include: { offerings: { include: { subject: true } } } } },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const existing = await this.prisma.classSubjectLoad.findMany({
      where: { schoolId: actor.schoolId, sessionId, classArmId },
      select: { subjectId: true },
    });
    const taken = new Set(existing.map((load) => load.subjectId));
    const offered = rosterForArm(classArm.classLevel.offerings, classArm.stream);
    return offered
      .filter((subject) => !taken.has(subject.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((subject) => ({ subjectId: subject.id, subjectName: subject.name }));
  }

  /**
   * Puts a subject on this class's list with its share of the week's 40
   * learning periods, with no teacher required yet. The share comes from
   * the class level's whole offered roster, not just what's been added so
   * far, so adding subjects one at a time lands on the same numbers as
   * adding them all at once.
   */
  async addSubject(actor: AuthenticatedStaff, sessionId: string, classArmId: string, subjectId: string) {
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);
    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: {
        classLevel: {
          select: { offerings: { select: { stream: true, subject: { select: { id: true, code: true } } } } },
        },
      },
    });
    if (!classArm) throw new NotFoundException("Class not found.");
    const roster = rosterForArm(classArm.classLevel.offerings, classArm.stream);
    const subject = roster.find((candidate) => candidate.id === subjectId);
    if (!subject) throw new BadRequestException("This class's department does not offer that subject.");

    const existing = await this.prisma.classSubjectLoad.findFirst({
      where: { schoolId: actor.schoolId, sessionId, classArmId, subjectId },
    });
    if (existing) throw new BadRequestException("This subject is already on the class's list.");

    const shares = distributePeriods(roster.map((candidate) => candidate.code));
    return this.prisma.classSubjectLoad.create({
      data: {
        schoolId: actor.schoolId,
        sessionId,
        classArmId,
        subjectId,
        periodsPerWeek: shares.get(subject.code) ?? 1,
        fixedDay: null,
      },
    });
  }

  /** Takes a subject off this class's list — any already-placed lessons for it stay until the next regenerate. */
  async removeSubject(actor: AuthenticatedStaff, sessionId: string, classArmId: string, subjectId: string) {
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);
    const load = await this.prisma.classSubjectLoad.findFirst({
      where: { schoolId: actor.schoolId, sessionId, classArmId, subjectId },
    });
    if (!load) throw new NotFoundException("This subject is not on the class's list.");
    await this.prisma.classSubjectLoad.delete({ where: { id: load.id } });
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
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);
    const load = await this.prisma.classSubjectLoad.findFirst({
      where: { schoolId: actor.schoolId, sessionId, classArmId, subjectId },
    });
    if (!load) throw new NotFoundException("This subject is not on the class's list.");
    return this.prisma.classSubjectLoad.update({
      where: { id: load.id },
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
    await assertWriterOrOwnFormTeacher(this.prisma, actor, sessionId, classArmId);

    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const [periods, loads, assignments, otherSlots] = await Promise.all([
      this.prisma.period.findMany({
        where: { schoolId: actor.schoolId, section: classArm.classLevel.section, isTeaching: true },
        orderBy: { sequence: "asc" },
      }),
      this.prisma.classSubjectLoad.findMany({
        where: { schoolId: actor.schoolId, sessionId, classArmId },
        include: { subject: { select: { name: true, comboGroup: true } } },
      }),
      this.prisma.subjectAssignment.findMany({ where: { schoolId: actor.schoolId, sessionId, classArmId } }),
      this.prisma.timetableSlot.findMany({
        where: { schoolId: actor.schoolId, sessionId, classArmId: { not: classArmId }, staffId: { not: null } },
        select: { staffId: true, dayOfWeek: true, periodId: true },
      }),
    ]);
    if (periods.length === 0) {
      throw new BadRequestException("No teaching periods are defined for this section yet. Add periods first.");
    }
    if (loads.length === 0) {
      throw new BadRequestException(
        "This class has no subjects on its list yet. Add subjects and set how many periods each needs first.",
      );
    }

    // Prep and Lesson are teaching periods but never subject slots — Prep is the
    // owner's own words "for reading, the students decide what they want to
    // read," and Lesson is left for the teacher to decide, not the generator.
    const assignablePeriods = periods.filter((period) => !/prep|lesson/i.test(period.name));

    // A subject with nobody to teach it yet is drafted anyway — owner's call — just
    // with no teacher clash to check, since there's no one yet to clash against.
    const staffBySubject = new Map(assignments.map((a) => [a.subjectId, a.staffId]));
    const comboSlotsBySubject = await this.comboSlotsForLoads(actor.schoolId, sessionId, loads);

    const busyElsewhere = new Set(otherSlots.map((slot) => `${slot.staffId}|${slot.dayOfWeek}|${slot.periodId}`));
    const { placed, unplaced } = planTimetable({
      days: DAYS,
      periods: assignablePeriods.map((period) => ({ id: period.id, sequence: period.sequence })),
      loads: loads.map((load) => ({
        subjectId: load.subjectId,
        staffId: staffBySubject.get(load.subjectId) ?? null,
        periodsPerWeek: load.periodsPerWeek,
        fixedDay: load.fixedDay,
        anchorPeriodIds: anchorFor(load.subject.name, load.fixedDay, assignablePeriods),
        comboSlots: comboSlotsBySubject.get(load.subjectId),
        comboGroup: load.subject.comboGroup,
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
    const placedWithoutTeacher = placed.filter((slot) => !slot.staffId).length;
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "timetable.autoGenerated",
      entityType: "ClassArm",
      entityId: classArmId,
      after: { sessionId, placed: placed.length, placedWithoutTeacher, unplaced },
    });

    const subjectIds = [...new Set(unplaced.map((item) => item.subjectId))];
    const subjects = subjectIds.length ? await this.prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : [];
    const subjectName = new Map(subjects.map((subject) => [subject.id, subject.name]));

    return {
      placed: placed.length,
      placedWithoutTeacher,
      unplaced: unplaced.map((item) => ({
        subjectId: item.subjectId,
        subjectName: subjectName.get(item.subjectId) ?? "—",
        missing: item.missing,
      })),
    };
  }

  /**
   * For every load whose subject is in a combo (owner's named elective
   * groups — Accounting/Chemistry/Government and the rest): whatever exact
   * (day, period) pairs a combo-mate already landed on this session, in any
   * arm. The first arm to generate a combo subject sets its slot for free;
   * everyone after is pinned to match it.
   */
  private async comboSlotsForLoads(
    schoolId: string,
    sessionId: string,
    loads: { subjectId: string; periodsPerWeek: number; subject: { comboGroup: string | null } }[],
  ): Promise<Map<string, { day: DayOfWeek; periodId: string }[]>> {
    const comboGroups = [
      ...new Set(loads.flatMap((load) => (load.subject.comboGroup ? [load.subject.comboGroup] : []))),
    ];
    if (comboGroups.length === 0) return new Map();

    const comboSubjects = await this.prisma.subject.findMany({
      where: { schoolId, comboGroup: { in: comboGroups } },
      select: { id: true, comboGroup: true },
    });
    const subjectIdsByGroup = new Map<string, string[]>();
    for (const subject of comboSubjects) {
      const group = subject.comboGroup as string;
      subjectIdsByGroup.set(group, [...(subjectIdsByGroup.get(group) ?? []), subject.id]);
    }

    const slotsByGroup = new Map<string, { day: DayOfWeek; periodId: string }[]>();
    for (const group of comboGroups) {
      const subjectIds = subjectIdsByGroup.get(group) ?? [];
      const slots = await this.prisma.timetableSlot.findMany({
        where: { schoolId, sessionId, subjectId: { in: subjectIds } },
        select: { dayOfWeek: true, periodId: true },
        distinct: ["dayOfWeek", "periodId"],
        orderBy: [{ dayOfWeek: "asc" }, { periodId: "asc" }],
      });
      slotsByGroup.set(
        group,
        slots.map((slot) => ({ day: slot.dayOfWeek, periodId: slot.periodId })),
      );
    }

    const result = new Map<string, { day: DayOfWeek; periodId: string }[]>();
    for (const load of loads) {
      const group = load.subject.comboGroup;
      if (!group) continue;
      const slots = slotsByGroup.get(group) ?? [];
      if (slots.length > 0) result.set(load.subjectId, slots.slice(0, load.periodsPerWeek));
    }
    return result;
  }
}

/**
 * A senior class offers some subjects to every department (stream: null) and
 * some to just one (Physics to Science, Government to Arts, Commerce to
 * Commercial) — the owner's own complaint was Physics and Government both
 * showing up for every arm regardless of department. Keeps only what this
 * arm's own department can actually take, deduped since a core subject can
 * appear once per department.
 */
export function rosterForArm<U extends { id: string }>(
  offerings: { subject: U; stream: Stream | null }[],
  armStream: Stream | null,
): U[] {
  const matching = offerings.filter((offering) => offering.stream === null || offering.stream === armStream);
  return [...new Map(matching.map((offering) => [offering.subject.id, offering.subject])).values()];
}

/**
 * The owner's two house rules for fixed-day subjects: Sports is always the
 * two periods right after the first on Wednesday, Clubs always the last two
 * before Prep on Thursday — not just "somewhere free that day." `periods` is
 * this section's teaching periods only, in sequence order.
 */
function anchorFor(subjectName: string, fixedDay: DayOfWeek | null, periods: { id: string }[]): string[] | undefined {
  if (fixedDay === DayOfWeek.WEDNESDAY && /sport/i.test(subjectName)) {
    return periods.slice(1, 3).map((period) => period.id);
  }
  if (fixedDay === DayOfWeek.THURSDAY && /club/i.test(subjectName)) {
    return periods.slice(-2).map((period) => period.id);
  }
  return undefined;
}
