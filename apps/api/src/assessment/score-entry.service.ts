import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, ResultSheetStatus, Role, type ClassArm, type ClassLevel, type Term } from "@prisma/client";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { UpsertScoreDto } from "@/assessment/schemas/score.schema";

export type ScoreSaveResult = {
  studentId: string;
  assessmentComponentId: string;
  ok: boolean;
  error?: string;
};

/**
 * §5.3 score entry: a spreadsheet-style grid, saved one cell at a time so an
 * offline sync queue can retry a single failed cell without resending the
 * whole class (PLAN.md §4.9). Scoped to a teacher's own subject × arm
 * assignment — FEATURES.md §1.1's "subject teacher: enters scores for
 * assigned subjects only" is enforced here, not just trusted from the client.
 */
@Injectable()
export class ScoreEntryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every actively-enrolled student in the class, every component for the term/section, and any score already entered. */
  async getGrid(actor: AuthenticatedStaff, termId: string, subjectId: string, classArmId: string) {
    const { term, classArm } = await this.assertCanEnter(actor, termId, subjectId, classArmId);

    const [enrolments, components, scores] = await Promise.all([
      this.prisma.enrolment.findMany({
        where: { schoolId: actor.schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
      this.prisma.assessmentComponent.findMany({
        where: { schoolId: actor.schoolId, termId, section: classArm.classLevel.section },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.score.findMany({
        where: { schoolId: actor.schoolId, termId, subjectId, classArmId },
      }),
    ]);

    return { students: enrolments.map((enrolment) => enrolment.student), components, scores };
  }

  async upsertScore(
    actor: AuthenticatedStaff,
    termId: string,
    subjectId: string,
    classArmId: string,
    dto: UpsertScoreDto,
  ): Promise<void> {
    const { term, classArm } = await this.assertCanEnter(actor, termId, subjectId, classArmId);
    await this.assertUnlocked(actor.schoolId, termId, subjectId, classArmId);

    const component = await this.prisma.assessmentComponent.findFirst({
      where: {
        id: dto.assessmentComponentId,
        schoolId: actor.schoolId,
        termId,
        section: classArm.classLevel.section,
      },
    });
    if (!component) throw new NotFoundException("Assessment component not found for this term and section.");
    if (dto.value > component.maxScore) {
      throw new BadRequestException([
        { path: ["value"], message: `${component.name} is out of ${component.maxScore}` },
      ]);
    }

    const enrolled = await this.prisma.enrolment.findFirst({
      where: {
        schoolId: actor.schoolId,
        studentId: dto.studentId,
        classArmId,
        sessionId: term.sessionId,
        status: EnrolmentStatus.ACTIVE,
      },
    });
    if (!enrolled) {
      throw new BadRequestException([{ path: ["studentId"], message: "Student is not enrolled in this class." }]);
    }

    await this.prisma.score.upsert({
      where: {
        termId_studentId_subjectId_assessmentComponentId: {
          termId,
          studentId: dto.studentId,
          subjectId,
          assessmentComponentId: dto.assessmentComponentId,
        },
      },
      create: {
        schoolId: actor.schoolId,
        termId,
        studentId: dto.studentId,
        subjectId,
        classArmId,
        assessmentComponentId: dto.assessmentComponentId,
        value: dto.value,
        enteredById: actor.id,
      },
      update: { value: dto.value, enteredById: actor.id },
    });
  }

  /** Each cell is applied independently; the caller learns which ones failed and why, so a sync queue retries only those. */
  async saveBatch(
    actor: AuthenticatedStaff,
    termId: string,
    subjectId: string,
    classArmId: string,
    scores: UpsertScoreDto[],
  ): Promise<ScoreSaveResult[]> {
    const results: ScoreSaveResult[] = [];
    for (const score of scores) {
      try {
        await this.upsertScore(actor, termId, subjectId, classArmId, score);
        results.push({ studentId: score.studentId, assessmentComponentId: score.assessmentComponentId, ok: true });
      } catch (error) {
        results.push({
          studentId: score.studentId,
          assessmentComponentId: score.assessmentComponentId,
          ok: false,
          error: error instanceof Error ? error.message : "Could not save this score.",
        });
      }
    }
    return results;
  }

  /** A teacher may only open their own subject × arm assignment this session; superadmin may open any, for corrections. */
  /** FEATURES.md §5.4: scores lock once a sheet leaves draft; only a reopen (unlock) makes them writable again. */
  private async assertUnlocked(schoolId: string, termId: string, subjectId: string, classArmId: string) {
    const sheet = await this.prisma.resultSheet.findFirst({
      where: { schoolId, termId, subjectId, classArmId },
      select: { status: true },
    });
    if (sheet && sheet.status !== ResultSheetStatus.DRAFT) {
      throw new ForbiddenException(
        `These scores are ${sheet.status.toLowerCase()} and locked. The principal or superadmin can reopen them with a reason.`,
      );
    }
  }

  private async assertCanEnter(
    actor: AuthenticatedStaff,
    termId: string,
    subjectId: string,
    classArmId: string,
  ): Promise<{ term: Term; classArm: ClassArm & { classLevel: ClassLevel } }> {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");

    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    if (!actor.roles.includes(Role.SUPERADMIN)) {
      const assignment = await this.prisma.subjectAssignment.findFirst({
        where: { schoolId: actor.schoolId, sessionId: term.sessionId, subjectId, classArmId, staffId: actor.id },
      });
      if (!assignment) throw new ForbiddenException("You are not assigned to teach this subject in this class.");
    }

    return { term, classArm };
  }
}
