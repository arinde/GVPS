export type SnapshotComponent = { id: string; name: string; maxScore: number };
export type SnapshotBand = { minScore: number; maxScore: number; letter: string; descriptor: string };
export type SnapshotRow = {
  studentId: string;
  studentName: string;
  admissionNo: string;
  scores: { componentId: string; value: number }[];
  total: number;
  maxTotal: number;
  grade: { letter: string; descriptor: string } | null;
};
/** FEATURES.md §5.5 — the frozen record of one subject sheet, taken at approval. Never recomputed. */
export type ResultSnapshot = {
  subjectName: string;
  components: SnapshotComponent[];
  bands: SnapshotBand[];
  rows: SnapshotRow[];
};

type StudentInput = { id: string; firstName: string; lastName: string; admissionNo: string };
type ScoreInput = { studentId: string; assessmentComponentId: string; value: number };

export function buildSnapshot(input: {
  subjectName: string;
  components: SnapshotComponent[];
  bands: SnapshotBand[];
  students: StudentInput[];
  scores: ScoreInput[];
}): ResultSnapshot {
  const maxTotal = input.components.reduce((sum, component) => sum + component.maxScore, 0);
  const rows = input.students.map((student): SnapshotRow => {
    const scores = input.components.map((component) => {
      const score = input.scores.find(
        (candidate) => candidate.studentId === student.id && candidate.assessmentComponentId === component.id,
      );
      return { componentId: component.id, value: score?.value ?? 0 };
    });
    const total = scores.reduce((sum, score) => sum + score.value, 0);
    const band = input.bands.find((candidate) => total >= candidate.minScore && total <= candidate.maxScore);
    return {
      studentId: student.id,
      studentName: `${student.lastName}, ${student.firstName}`,
      admissionNo: student.admissionNo,
      scores,
      total,
      maxTotal,
      grade: band ? { letter: band.letter, descriptor: band.descriptor } : null,
    };
  });

  return { subjectName: input.subjectName, components: input.components, bands: input.bands, rows };
}

export function isSnapshot(value: unknown): value is ResultSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ResultSnapshot>;
  return (
    typeof candidate.subjectName === "string" && Array.isArray(candidate.components) && Array.isArray(candidate.rows)
  );
}
