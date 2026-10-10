import type { DayOfWeek } from "@prisma/client";

export type SubjectLoad = {
  subjectId: string;
  /** Null until a teacher is assigned — the subject is placed anyway, just with no clash check. */
  staffId: string | null;
  periodsPerWeek: number;
  /** Pins every occurrence to one day — Sports every Wednesday — instead of spreading across the week. */
  fixedDay: DayOfWeek | null;
  /**
   * Owner's fixed house rules (Sports always the two periods after the first
   * on Wednesday, Clubs always the last two before Prep on Thursday) land on
   * exact periods, not just "somewhere free that day." Only meaningful with
   * `fixedDay` set; ignored otherwise.
   */
  anchorPeriodIds?: string[];
  /**
   * Senior elective combos (Accounting/Chemistry/Government, and the owner's
   * other named groups): exact (day, period) pairs copied from whichever
   * combo-mate another arm already placed this session, so a regenerate
   * stays stable and a second arm (if one ever exists) lands on the same
   * slots as the first. Takes priority over `fixedDay`.
   */
  comboSlots?: { day: DayOfWeek; periodId: string }[];
  /**
   * The owner's named elective combo this subject belongs to (same string
   * for every member — "combo-1" for Accounting/Chemistry/Government, etc.).
   * One class's students split across these at the same slot, so every
   * member shares the period instead of taking its own — this is what makes
   * a slot legitimately hold more than one subject at once.
   */
  comboGroup?: string | null;
};
export type TeachingPeriod = { id: string; sequence: number };
export type PlannedSlot = { day: DayOfWeek; periodId: string; subjectId: string; staffId: string | null };
export type UnplacedLoad = { subjectId: string; missing: number };

/** A class can't sit the same subject for more than two periods back to back — the owner's own cap. */
const MAX_CONSECUTIVE_PERIODS = 2;

/** Every load not in a combo still owns its slot exclusively — this key just makes that explicit. */
function groupKeyOf(load: SubjectLoad): string {
  return load.comboGroup ?? `solo:${load.subjectId}`;
}

/**
 * FEATURES.md §8.1 — fills one class's week from its subject list, instead of
 * a human placing each cell by hand.
 *
 * A slot is "occupied" by a group key, not a bare flag: a plain subject's
 * group key is just itself, so it still owns its slot exclusively, but
 * every subject in the same elective combo shares one key — so a slot one
 * of them has already claimed stays open to the rest of the combo, letting
 * several subjects legitimately sit in the same period (different students
 * are in different combo rooms at once).
 *
 * Combo subjects are placed first (synced to another arm's prior slots if
 * any, then filling whatever more the whole combo still needs together),
 * then fixed-day subjects (Sports every Wednesday) onto their exact anchors
 * when given, then everything else walked slot by slot through the whole
 * week in order — Monday period 1, Monday period 2, … Friday's last period —
 * handing each empty slot to the next subject in a rotating queue rather
 * than letting one subject exhaust its whole week before moving to the next
 * (what keeps the same subject off the same period every day). Every pass
 * refuses to extend any one subject past two back-to-back periods on the
 * same day — never a "triple." `busyElsewhere` is every (teacher, day,
 * period) another arm already holds this session — the same clash a manual
 * edit is refused for. A subject with no teacher yet (owner's call: draft
 * the whole week regardless of staffing) is placed with no clash check at
 * all, since there's no one to clash against.
 */
export function planTimetable(input: {
  days: DayOfWeek[];
  periods: TeachingPeriod[];
  loads: SubjectLoad[];
  busyElsewhere: ReadonlySet<string>;
}): { placed: PlannedSlot[]; unplaced: UnplacedLoad[] } {
  const placed: PlannedSlot[] = [];
  const occupant = new Map<string, string>(); // `${day}|${periodId}` -> group key
  // A combo slot can hold several subjects, but never the SAME subject twice —
  // without this, the combo pass could re-place a subject already seated
  // there (e.g. by the comboSlots sync) when it still needs periods elsewhere.
  const placedSubjectSlot = new Set<string>(); // `${day}|${periodId}|${subjectId}`
  const teacherBusy = new Set(input.busyElsewhere);
  const remaining = new Map(input.loads.map((load) => [load.subjectId, load.periodsPerWeek]));
  // The subject and run-length of whatever was last placed on each day, by period sequence —
  // used to refuse a third period in a row for the same subject.
  const lastOnDay = new Map<DayOfWeek, { subjectId: string; sequence: number; run: number }>();

  function isAdjacentRun(day: DayOfWeek, period: TeachingPeriod, subjectId: string) {
    const last = lastOnDay.get(day);
    return last !== undefined && last.subjectId === subjectId && last.sequence === period.sequence - 1 ? last : null;
  }

  function wouldExceedCap(day: DayOfWeek, period: TeachingPeriod, subjectId: string): boolean {
    const run = isAdjacentRun(day, period, subjectId);
    return run !== null && run.run >= MAX_CONSECUTIVE_PERIODS;
  }

  function recordPlacement(day: DayOfWeek, period: TeachingPeriod, subjectId: string): void {
    const run = isAdjacentRun(day, period, subjectId);
    lastOnDay.set(day, { subjectId, sequence: period.sequence, run: run ? run.run + 1 : 1 });
  }

  function isFree(day: DayOfWeek, period: TeachingPeriod, groupKey: string): boolean {
    const holder = occupant.get(`${day}|${period.id}`);
    return holder === undefined || holder === groupKey;
  }

  function canPlace(day: DayOfWeek, period: TeachingPeriod, load: SubjectLoad): boolean {
    if (placedSubjectSlot.has(`${day}|${period.id}|${load.subjectId}`)) return false;
    if (!isFree(day, period, groupKeyOf(load))) return false;
    if (load.staffId && teacherBusy.has(`${load.staffId}|${day}|${period.id}`)) return false;
    return !wouldExceedCap(day, period, load.subjectId);
  }

  function commit(day: DayOfWeek, period: TeachingPeriod, load: SubjectLoad): void {
    occupant.set(`${day}|${period.id}`, groupKeyOf(load));
    placedSubjectSlot.add(`${day}|${period.id}|${load.subjectId}`);
    if (load.staffId) teacherBusy.add(`${load.staffId}|${day}|${period.id}`);
    placed.push({ day, periodId: period.id, subjectId: load.subjectId, staffId: load.staffId });
    recordPlacement(day, period, load.subjectId);
    remaining.set(load.subjectId, (remaining.get(load.subjectId) ?? 0) - 1);
  }

  // Combo subjects pinned to exact slots a combo-mate already claimed elsewhere
  // this session (another arm, or this same arm's last generate) — placed
  // before anything else so every later pass sees them as taken.
  for (const load of input.loads) {
    if (!load.comboSlots || load.comboSlots.length === 0) continue;
    for (const slot of load.comboSlots) {
      if ((remaining.get(load.subjectId) ?? 0) <= 0) break;
      const period = input.periods.find((candidate) => candidate.id === slot.periodId);
      if (!period || !canPlace(slot.day, period, load)) continue;
      commit(slot.day, period, load);
    }
  }

  // Whatever a combo still needs beyond its synced slots, every member of the
  // combo fills together — the same (day, period) given to all of them at
  // once, so the ones short of their own comboSlots catch up in step.
  const comboGroups = [...new Set(input.loads.flatMap((load) => (load.comboGroup ? [load.comboGroup] : [])))];
  for (const group of comboGroups) {
    const members = input.loads.filter((load) => load.comboGroup === group);
    const stillNeeded = () => members.some((member) => (remaining.get(member.subjectId) ?? 0) > 0);
    for (const day of input.days) {
      for (const period of input.periods) {
        if (!stillNeeded()) break;
        const eligible = members.filter(
          (member) => (remaining.get(member.subjectId) ?? 0) > 0 && canPlace(day, period, member),
        );
        for (const member of eligible) commit(day, period, member);
      }
      if (!stillNeeded()) break;
    }
  }

  for (const load of input.loads) {
    if (!load.fixedDay) continue;
    const candidates = load.anchorPeriodIds
      ? load.anchorPeriodIds.flatMap((id) => input.periods.find((period) => period.id === id) ?? [])
      : input.periods;
    for (const period of candidates) {
      if ((remaining.get(load.subjectId) ?? 0) <= 0) break;
      if (!canPlace(load.fixedDay, period, load)) continue;
      commit(load.fixedDay, period, load);
    }
  }

  let pool = input.loads.filter(
    (load) => !load.fixedDay && !load.comboGroup && (remaining.get(load.subjectId) ?? 0) > 0,
  );
  let pointer = 0;

  function placeFromPool(day: DayOfWeek, period: TeachingPeriod, index: number): void {
    const load = pool[index];
    commit(day, period, load);
    pointer = index + 1;
    if ((remaining.get(load.subjectId) ?? 0) <= 0)
      pool = pool.filter((candidate) => candidate.subjectId !== load.subjectId);
  }

  // A real timetable isn't all singles — the owner's own complaint was most
  // days coming out single-period-only. Each day, try once (at the first
  // opening) to pair two adjacent free periods for one subject that still
  // needs at least two more, before falling back to one-at-a-time rotation.
  function tryOpenDayWithDouble(day: DayOfWeek, index: number): boolean {
    for (let i = index; i < input.periods.length - 1; i++) {
      const first = input.periods[i];
      const second = input.periods[i + 1];
      if (second.sequence !== first.sequence + 1) continue;

      for (let attempt = 0; attempt < pool.length; attempt++) {
        const poolIndex = (pointer + attempt) % pool.length;
        const load = pool[poolIndex];
        if ((remaining.get(load.subjectId) ?? 0) < 2) continue;
        if (!canPlace(day, first, load) || !canPlace(day, second, load)) continue;
        placeFromPool(day, first, poolIndex);
        // `pool`/`pointer` may have shifted — the subject is still the same, find it again for the second half.
        const stillIndex = pool.findIndex((candidate) => candidate.subjectId === load.subjectId);
        if (stillIndex === -1) return true; // exactly used up by the first placement; nothing left to pair
        placeFromPool(day, second, stillIndex);
        return true;
      }
    }
    return false;
  }

  for (const day of input.days) {
    let openedWithDouble = false;
    for (let i = 0; i < input.periods.length; i++) {
      const period = input.periods[i];
      if (pool.length === 0) continue;

      if (!openedWithDouble) {
        openedWithDouble = true;
        // The double may land further ahead than `i`, not necessarily on this
        // exact slot — fall through either way so slot `i` still gets a chance below.
        tryOpenDayWithDouble(day, i);
      }

      for (let attempt = 0; attempt < pool.length; attempt++) {
        const index = (pointer + attempt) % pool.length;
        if (!canPlace(day, period, pool[index])) continue;
        placeFromPool(day, period, index);
        break;
      }
    }
  }

  const unplaced: UnplacedLoad[] = [];
  for (const load of input.loads) {
    const left = remaining.get(load.subjectId) ?? 0;
    if (left > 0) unplaced.push({ subjectId: load.subjectId, missing: left });
  }

  // Belt and suspenders: the DB's own unique index is (classArmId, day,
  // period, subject) per caller, so two rows for the same (day, period,
  // subject) here would fail the whole batch insert — never write them.
  const seen = new Set<string>();
  const dedupedPlaced = placed.filter((slot) => {
    const key = `${slot.day}|${slot.periodId}|${slot.subjectId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { placed: dedupedPlaced, unplaced };
}
