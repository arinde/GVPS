import type { DayOfWeek } from "@prisma/client";

export type SubjectLoad = {
  subjectId: string;
  staffId: string;
  periodsPerWeek: number;
  /** Pins every occurrence to one day — Sports every Wednesday — instead of spreading across the week. */
  fixedDay: DayOfWeek | null;
};
export type TeachingPeriod = { id: string; sequence: number };
export type PlannedSlot = { day: DayOfWeek; periodId: string; subjectId: string; staffId: string };
export type UnplacedLoad = { subjectId: string; missing: number };

/**
 * FEATURES.md §8.1 — fills one class's week from its subject list, instead of
 * a human placing each cell by hand. Greedy, in demand order (the subject
 * needing the most periods picks first). Each subject is placed one round
 * trip through the days at a time — Monday, Tuesday, … — so it only doubles
 * up on a day once every other day already has it, rather than piling up on
 * the first day with room. `busyElsewhere` is every (teacher, day, period)
 * another arm already holds this session — the same clash a manual edit is
 * refused for.
 */
export function planTimetable(input: {
  days: DayOfWeek[];
  periods: TeachingPeriod[];
  loads: SubjectLoad[];
  busyElsewhere: ReadonlySet<string>;
}): { placed: PlannedSlot[]; unplaced: UnplacedLoad[] } {
  const placed: PlannedSlot[] = [];
  const unplaced: UnplacedLoad[] = [];
  const filled = new Set<string>();
  const teacherBusy = new Set(input.busyElsewhere);

  const queue = [...input.loads].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  for (const load of queue) {
    let remaining = load.periodsPerWeek;
    const candidateDays = load.fixedDay ? [load.fixedDay] : input.days;
    let dayPointer = 0;
    // Caps the search so a day with genuinely nothing free can't loop forever.
    let safety = candidateDays.length * (input.periods.length + 1) * 2;

    while (remaining > 0 && safety-- > 0) {
      const day = candidateDays[dayPointer % candidateDays.length];
      dayPointer++;

      const period = input.periods.find((candidate) => {
        if (filled.has(`${day}|${candidate.id}`)) return false;
        if (teacherBusy.has(`${load.staffId}|${day}|${candidate.id}`)) return false;
        return true;
      });
      if (!period) continue;

      filled.add(`${day}|${period.id}`);
      teacherBusy.add(`${load.staffId}|${day}|${period.id}`);
      placed.push({ day, periodId: period.id, subjectId: load.subjectId, staffId: load.staffId });
      remaining--;
    }

    if (remaining > 0) unplaced.push({ subjectId: load.subjectId, missing: remaining });
  }

  return { placed, unplaced };
}
