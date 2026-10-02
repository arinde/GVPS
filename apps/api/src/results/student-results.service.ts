import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AccessScopeService } from "@/access/access-scope.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

// FEATURES.md §14 "Report cards" row: superadmin/principal/admin read the
// whole school; a form teacher reads only their own arm. Bursar has no
// result access at all (§1.1), and a subject teacher's access stops at the
// score entry grid for their own subject (§14 "Score entry" row) — neither
// gets this wider, cross-subject view, even though both can see the
// student's registry record via the broader access scope used elsewhere.
const RESULTS_READERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY, Role.FORM_TEACHER];
const WHOLE_SCHOOL_RESULTS_READERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY];

export type SubjectResult = {
  subjectId: string;
  subjectName: string;
  scores: { componentId: string; componentName: string; maxScore: number; value: number }[];
  total: number;
  maxTotal: number;
  grade: { letter: string; descriptor: string } | null;
};

export type StudentResults = {
  term: { id: string; name: string } | null;
  subjects: SubjectResult[];
};

/**
 * Shared by the staff-side results read and the parent portal's read-only
 * grades view (FEATURES.md §14 "Report cards" row grants parents read access
 * to their own wards') — each does its own access check first, then calls
 * this for the same score/grade computation.
 */
export async function computeStudentResults(
  prisma: PrismaService,
  schoolId: string,
  studentId: string,
): Promise<StudentResults> {
  const enrolment = await prisma.enrolment.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: { classArm: { include: { classLevel: true } } },
  });
  if (!enrolment) return { term: null, subjects: [] };

  const term = await prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
  if (!term) return { term: null, subjects: [] };

  const [components, scores, gradingScale] = await Promise.all([
    prisma.assessmentComponent.findMany({
      where: { schoolId, termId: term.id, section: enrolment.classArm.classLevel.section },
    }),
    prisma.score.findMany({ where: { schoolId, termId: term.id, studentId } }),
    prisma.gradingScale.findUnique({
      where: { schoolId_section: { schoolId, section: enrolment.classArm.classLevel.section } },
      include: { bands: true },
    }),
  ]);

  const maxTotal = components.reduce((sum, component) => sum + component.maxScore, 0);
  const subjectIds = [...new Set(scores.map((score) => score.subjectId))];
  const subjects = subjectIds.length
    ? await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
    : [];

  const results = subjects
    .map((subject): SubjectResult => {
      const subjectScores = scores.filter((score) => score.subjectId === subject.id);
      const detail = components.map((component) => {
        const score = subjectScores.find((candidate) => candidate.assessmentComponentId === component.id);
        return {
          componentId: component.id,
          componentName: component.name,
          maxScore: component.maxScore,
          value: score?.value ?? 0,
        };
      });
      const total = detail.reduce((sum, item) => sum + item.value, 0);
      const isComplete = subjectScores.length === components.length && components.length > 0;
      const band =
        isComplete && gradingScale
          ? gradingScale.bands.find((b) => total >= b.minScore && total <= b.maxScore)
          : undefined;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        scores: detail,
        total,
        maxTotal,
        grade: band ? { letter: band.letter, descriptor: band.descriptor } : null,
      };
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  return { term: { id: term.id, name: term.name }, subjects: results };
}

/**
 * First piece of the `results` module (PLAN.md §3): a live read of a
 * student's current scores and grades, for the profile page. This is a
 * preview, not the frozen computation FEATURES.md §5.5 will produce at
 * approval — that engine, and the rest of this module, lands with Block 2.
 */
@Injectable()
export class StudentResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessScopeService,
  ) {}

  async getForStudent(actor: AuthenticatedStaff, studentId: string): Promise<StudentResults> {
    if (!actor.roles.some((role) => RESULTS_READERS.includes(role))) {
      throw new ForbiddenException("You do not have access to results.");
    }

    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId: actor.schoolId } });
    if (!student) throw new NotFoundException("Student not found.");

    const enrolment = await this.prisma.enrolment.findFirst({
      where: { studentId, status: "ACTIVE" },
      include: { classArm: { include: { classLevel: true } } },
    });
    if (!enrolment) return { term: null, subjects: [] };

    if (!actor.roles.some((role) => WHOLE_SCHOOL_RESULTS_READERS.includes(role))) {
      // Form teacher: their own arm only — narrower than the general student
      // access scope, which also covers classes they merely teach a subject in.
      const { armIds } = await this.access.allocatedArms(actor);
      if (!armIds.includes(enrolment.classArmId)) {
        throw new ForbiddenException("This student is not in one of your classes.");
      }
    }

    return computeStudentResults(this.prisma, actor.schoolId, studentId);
  }
}
