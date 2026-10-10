import { competitionRanks } from "@/assessment/report-card";
import type { ResultSnapshot } from "@/assessment/result-snapshot";

export type BroadsheetCell = { total: number; maxTotal: number; grade: { letter: string; descriptor: string } | null };

export type BroadsheetRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  /** Same order as the parent `Broadsheet.subjects` — null where that subject isn't published yet for this student. */
  scores: (BroadsheetCell | null)[];
  total: number;
  maxTotal: number;
  average: number;
  position: number;
};

export type Broadsheet = {
  classLabel: string;
  term: { name: string; sequence: number };
  subjects: { subjectId: string; subjectName: string }[];
  rows: BroadsheetRow[];
  classSize: number;
};

type StudentIn = { studentId: string; name: string; admissionNo: string };
type SubjectIn = { subjectId: string; subjectName: string; snapshot: ResultSnapshot };

/**
 * FEATURES.md §5.9 — the whole arm's score matrix, one row per student, one
 * column per subject published so far. Computed live from the same
 * published ResultSheet snapshots a report card reads, not frozen again —
 * each subject's own numbers are already frozen, and a broadsheet is just
 * every one of them laid out side by side.
 */
export function buildBroadsheet(input: {
  term: { name: string; sequence: number };
  classLabel: string;
  students: StudentIn[];
  subjects: SubjectIn[];
}): Broadsheet {
  const subjectColumns = [...input.subjects].sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const termAverage = new Map<string, number>();
  const rows = input.students.map((student) => {
    let total = 0;
    let maxTotal = 0;
    let countedSubjects = 0;
    const scores = subjectColumns.map((subject): BroadsheetCell | null => {
      const row = subject.snapshot.rows.find((candidate) => candidate.studentId === student.studentId);
      if (!row) return null;
      total += row.total;
      maxTotal += row.maxTotal;
      countedSubjects++;
      return { total: row.total, maxTotal: row.maxTotal, grade: row.grade };
    });
    const average = countedSubjects ? Math.round((total / countedSubjects) * 100) / 100 : 0;
    termAverage.set(student.studentId, average);
    return {
      studentId: student.studentId,
      name: student.name,
      admissionNo: student.admissionNo,
      scores,
      total,
      maxTotal,
      average,
      position: 0,
    };
  });

  const ranks = competitionRanks(termAverage);
  for (const row of rows) row.position = ranks.get(row.studentId) ?? 0;
  rows.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  return {
    classLabel: input.classLabel,
    term: input.term,
    subjects: subjectColumns.map((subject) => ({ subjectId: subject.subjectId, subjectName: subject.subjectName })),
    rows,
    classSize: input.students.length,
  };
}
