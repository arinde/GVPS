import type { ResultSnapshot } from "@/assessment/result-snapshot";

/** FEATURES.md §5.6 — the trait list, per section group. Rated 1–5 by the form teacher. */
export const TRAIT_GROUPS = {
  affective: ["punctuality", "neatness", "politeness", "honesty", "cooperation", "attentiveness"],
  psychomotor: ["handwriting", "sports", "drawing", "craft", "musicalSkill"],
} as const;

export const ALL_TRAITS: readonly string[] = [...TRAIT_GROUPS.affective, ...TRAIT_GROUPS.psychomotor];

export type RemarkInput = {
  formComment: string | null;
  principalComment: string | null;
  traits: Record<string, number> | null;
};

export type ReportCardSubject = {
  subjectName: string;
  total: number;
  maxTotal: number;
  grade: { letter: string; descriptor: string } | null;
  position: number;
  classSize: number;
  classAverage: number;
  highest: number;
  lowest: number;
  scores: { componentName: string; maxScore: number; value: number }[];
};

export type ReportCardFrozen = {
  term: { name: string; sequence: number; timesSchoolOpened: number | null };
  classLabel: string;
  student: { name: string; admissionNo: string };
  subjects: ReportCardSubject[];
  totals: { total: number; maxTotal: number; average: number; position: number; classSize: number };
  cumulative: { average: number; termsCounted: number };
  promotion: { threshold: number; recommended: boolean } | null;
  remarks: RemarkInput;
  feeBalanceKobo: number;
  // FEATURES.md §4.3: days actually attended, against the term's own "times
  // school opened" above — the report card's standard attendance field.
  attendance: { timesPresent: number };
  publishedAt: string;
};

type StudentIn = { studentId: string; name: string; admissionNo: string };
type SubjectIn = { subjectId: string; snapshot: ResultSnapshot };

export type ArmInput = {
  term: { name: string; sequence: number; timesSchoolOpened: number | null };
  classLabel: string;
  students: StudentIn[];
  subjects: SubjectIn[];
  remarks: Map<string, RemarkInput>;
  /** Each student's term averages from earlier terms of the same session. */
  priorAverages: Map<string, number[]>;
  promotionThreshold: number | null;
  feeBalanceKobo: Map<string, number>;
  /** Days actually attended this term, per student — see `ReportCardFrozen.attendance`. */
  timesPresent: Map<string, number>;
  publishedAt: Date;
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Standard competition ranking: equal values share a rank, and the next rank skips them (1, 2, 2, 4). */
export function competitionRanks(values: Map<string, number>): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const [id, value] of values) {
    let higher = 0;
    for (const other of values.values()) if (other > value) higher++;
    ranks.set(id, higher + 1);
  }
  return ranks;
}

/** Every number a report card shows, computed once from the approved snapshots of one class and term. */
export function buildReportCards(input: ArmInput): Map<string, ReportCardFrozen> {
  const subjectRows = input.subjects.map((subject) => {
    const totals = new Map(subject.snapshot.rows.map((row) => [row.studentId, row.total]));
    const values = [...totals.values()];
    return {
      subject,
      totals,
      ranks: competitionRanks(totals),
      classAverage: values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      highest: values.length ? Math.max(...values) : 0,
      lowest: values.length ? Math.min(...values) : 0,
    };
  });

  const termAverage = new Map<string, number>();
  const termTotals = new Map<string, { total: number; maxTotal: number; subjects: number }>();
  for (const student of input.students) {
    let total = 0;
    let maxTotal = 0;
    let subjects = 0;
    for (const row of subjectRows) {
      const studentRow = row.subject.snapshot.rows.find((candidate) => candidate.studentId === student.studentId);
      if (!studentRow) continue;
      total += studentRow.total;
      maxTotal += studentRow.maxTotal;
      subjects++;
    }
    termTotals.set(student.studentId, { total, maxTotal, subjects });
    termAverage.set(student.studentId, subjects ? round2(total / subjects) : 0);
  }
  const armPositions = competitionRanks(termAverage);
  const classSize = input.students.length;

  const cards = new Map<string, ReportCardFrozen>();
  for (const student of input.students) {
    const totals = termTotals.get(student.studentId) ?? { total: 0, maxTotal: 0, subjects: 0 };
    const average = termAverage.get(student.studentId) ?? 0;
    const prior = input.priorAverages.get(student.studentId) ?? [];
    const allAverages = [...prior, average];
    const cumulative = round2(allAverages.reduce((sum, value) => sum + value, 0) / allAverages.length);

    const subjects = subjectRows.flatMap((row): ReportCardSubject[] => {
      const studentRow = row.subject.snapshot.rows.find((candidate) => candidate.studentId === student.studentId);
      if (!studentRow) return [];
      return [
        {
          subjectName: row.subject.snapshot.subjectName,
          total: studentRow.total,
          maxTotal: studentRow.maxTotal,
          grade: studentRow.grade,
          position: row.ranks.get(student.studentId) ?? 0,
          classSize: row.totals.size,
          classAverage: row.classAverage,
          highest: row.highest,
          lowest: row.lowest,
          scores: studentRow.scores.map((score) => {
            const component = row.subject.snapshot.components.find((candidate) => candidate.id === score.componentId);
            return { componentName: component?.name ?? "", maxScore: component?.maxScore ?? 0, value: score.value };
          }),
        },
      ];
    });

    // FEATURES.md §5.5: promotion is recommended at the third term, against the scale's threshold.
    const promotion =
      input.term.sequence === 3 && input.promotionThreshold !== null
        ? { threshold: input.promotionThreshold, recommended: cumulative >= input.promotionThreshold }
        : null;

    cards.set(student.studentId, {
      term: input.term,
      classLabel: input.classLabel,
      student: { name: student.name, admissionNo: student.admissionNo },
      subjects: subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
      totals: {
        total: totals.total,
        maxTotal: totals.maxTotal,
        average,
        position: armPositions.get(student.studentId) ?? 0,
        classSize,
      },
      cumulative: { average: cumulative, termsCounted: allAverages.length },
      promotion,
      remarks: input.remarks.get(student.studentId) ?? { formComment: null, principalComment: null, traits: null },
      feeBalanceKobo: input.feeBalanceKobo.get(student.studentId) ?? 0,
      attendance: { timesPresent: input.timesPresent.get(student.studentId) ?? 0 },
      publishedAt: input.publishedAt.toISOString(),
    });
  }
  return cards;
}

export function isReportCard(value: unknown): value is ReportCardFrozen {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ReportCardFrozen>;
  return Array.isArray(candidate.subjects) && typeof candidate.totals === "object" && candidate.totals !== null;
}
