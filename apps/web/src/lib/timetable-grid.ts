import type { ArmGrid, DayOfWeek, Period, TimetableSlotView } from "@/store/api/timetable-api";

export type SubjectEntry = {
  subjectId: string;
  subjectName: string;
  staffId: string | null;
  staffName: string;
  isActivity: boolean;
};
export type SubjectCellAction = { type: "subject"; span: number; endTime: string; subjects: SubjectEntry[] };
export type EmptyCellAction = { type: "empty" };
export type ConsumedCellAction = { type: "consumed" };
export type CellAction = SubjectCellAction | EmptyCellAction | ConsumedCellAction;

function toEntry(slot: TimetableSlotView): SubjectEntry {
  return {
    subjectId: slot.subjectId,
    subjectName: slot.subjectName,
    staffId: slot.staffId,
    staffName: slot.staffName,
    isActivity: slot.fixedDay !== null,
  };
}

function slotsFor(slots: TimetableSlotView[], day: DayOfWeek, periodId: string) {
  return slots.filter((slot) => slot.dayOfWeek === day && slot.periodId === periodId);
}

/**
 * One day's worth of teaching-period cells. A period with exactly one
 * subject merges forward into consecutive periods holding that same subject
 * and teacher, into a single "double period" action. A period with more
 * than one subject is an elective combo (different students, different
 * combo rooms, same period) — shown as one cell listing every subject, with
 * no merge attempted, since each combo member can have its own span and
 * synchronising that visually isn't worth the complexity it would add here.
 * Both are derived purely from what the backend placed, never assumed. A
 * period two doors down the sequence never merges with one before a break,
 * since the break's own sequence number sits between them.
 */
export function buildDayActions(grid: ArmGrid, day: DayOfWeek): Map<string, CellAction> {
  const teaching = grid.periods.filter((period) => period.isTeaching);
  const actions = new Map<string, CellAction>();

  let i = 0;
  while (i < teaching.length) {
    const period = teaching[i];
    const slots = slotsFor(grid.slots, day, period.id);
    if (slots.length === 0) {
      actions.set(period.id, { type: "empty" });
      i++;
      continue;
    }

    if (slots.length > 1) {
      actions.set(period.id, { type: "subject", span: 1, endTime: period.endTime, subjects: slots.map(toEntry) });
      i++;
      continue;
    }

    const slot = slots[0];
    let last = period;
    let j = i + 1;
    while (j < teaching.length) {
      const next = teaching[j];
      if (next.sequence !== last.sequence + 1) break;
      const nextSlots = slotsFor(grid.slots, day, next.id);
      if (
        nextSlots.length !== 1 ||
        nextSlots[0].subjectId !== slot.subjectId ||
        nextSlots[0].staffId !== slot.staffId
      ) {
        break;
      }
      actions.set(next.id, { type: "consumed" });
      last = next;
      j++;
    }

    actions.set(period.id, { type: "subject", span: j - i, endTime: last.endTime, subjects: [toEntry(slot)] });
    i = j;
  }

  return actions;
}

const JS_DAY_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
};

/** Null on a weekend — nothing in `days` to highlight. */
export function todayDayOfWeek(days: DayOfWeek[], now = new Date()): DayOfWeek | null {
  const day = JS_DAY_TO_DAY_OF_WEEK[now.getDay()];
  return day && days.includes(day) ? day : null;
}

export function timeRange(period: Period, endTime: string): string {
  return `${period.startTime}–${endTime}`;
}

/** "Prep is for reading" (owner's words) — an empty Prep period reads as a reading period, not a blank lesson slot. */
export function isReadingPeriod(period: Period): boolean {
  return period.name.toLowerCase().includes("prep");
}
