import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EnrolmentStatus, Prisma, ResultSheetStatus, Role, type ResultSheet } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import { buildSnapshot, type ResultSnapshot } from "@/assessment/result-snapshot";
import { ReportCardPublisher } from "@/assessment/report-card-publisher.service";

const WHOLE_SCHOOL_APPROVERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL];

/**
 * FEATURES.md §5.4 — draft → submitted (subject teacher) → reviewed (form
 * teacher) → approved (principal) → published. Each step needs the step
 * before it, so nothing skips review. Unlocking reopens a sheet to draft with
 * a mandatory reason; it is written to the audit log like every other step.
 */
@Injectable()
export class ResultApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly reportCards: ReportCardPublisher,
  ) {}

  /** The live scores for one subject in one arm — what a reviewer checks before marking it reviewed. */
  async scores(actor: AuthenticatedStaff, termId: string, classArmId: string, subjectId: string) {
    const term = await this.termFor(actor.schoolId, termId);
    await this.assertCanRead(actor, term.sessionId, classArmId);

    const classArm = await this.prisma.classArm.findFirstOrThrow({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    const [components, enrolments, scores] = await Promise.all([
      this.prisma.assessmentComponent.findMany({
        where: { schoolId: actor.schoolId, termId, section: classArm.classLevel.section },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.enrolment.findMany({
        where: { schoolId: actor.schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
      this.prisma.score.findMany({
        where: { schoolId: actor.schoolId, termId, subjectId, classArmId },
        select: { studentId: true, assessmentComponentId: true, value: true },
      }),
    ]);

    return {
      components: components.map((component) => ({
        id: component.id,
        name: component.name,
        maxScore: component.maxScore,
      })),
      rows: enrolments.map(({ student }) => {
        const values = components.map((component) => {
          const score = scores.find(
            (candidate) => candidate.studentId === student.id && candidate.assessmentComponentId === component.id,
          );
          return { componentId: component.id, value: score?.value ?? null };
        });
        return {
          studentId: student.id,
          name: `${student.lastName}, ${student.firstName}`,
          admissionNo: student.admissionNo,
          values,
          total: values.reduce((sum, value) => sum + (value.value ?? 0), 0),
        };
      }),
    };
  }

  async status(actor: AuthenticatedStaff, termId: string, classArmId: string) {
    const term = await this.termFor(actor.schoolId, termId);
    await this.assertCanRead(actor, term.sessionId, classArmId);

    const [assignments, sheets] = await Promise.all([
      this.prisma.subjectAssignment.findMany({
        where: { schoolId: actor.schoolId, sessionId: term.sessionId, classArmId },
        select: {
          subjectId: true,
          subject: { select: { name: true } },
          staff: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { subject: { name: "asc" } },
      }),
      this.prisma.resultSheet.findMany({ where: { schoolId: actor.schoolId, termId, classArmId } }),
    ]);

    return {
      subjects: assignments.map((assignment) => {
        const sheet = sheets.find((candidate) => candidate.subjectId === assignment.subjectId);
        return {
          subjectId: assignment.subjectId,
          subjectName: assignment.subject.name,
          teacherName:
            assignment.staff.firstName && assignment.staff.lastName
              ? `${assignment.staff.firstName} ${assignment.staff.lastName}`
              : assignment.staff.email,
          status: sheet?.status ?? ResultSheetStatus.DRAFT,
          submittedAt: sheet?.submittedAt ?? null,
          approvedAt: sheet?.approvedAt ?? null,
          publishedAt: sheet?.publishedAt ?? null,
          unlockReason: sheet?.unlockReason ?? null,
        };
      }),
    };
  }

  async submit(actor: AuthenticatedStaff, termId: string, classArmId: string, subjectId: string) {
    const term = await this.termFor(actor.schoolId, termId);
    if (!actor.roles.includes(Role.SUPERADMIN)) {
      const mine = await this.prisma.subjectAssignment.findFirst({
        where: { schoolId: actor.schoolId, sessionId: term.sessionId, subjectId, classArmId, staffId: actor.id },
      });
      if (!mine) throw new ForbiddenException("You are not assigned to teach this subject in this class.");
    }

    const existing = await this.sheetFor(actor.schoolId, termId, classArmId, subjectId);
    if (existing && existing.status !== ResultSheetStatus.DRAFT) {
      throw new ConflictException(`These scores are already ${label(existing.status)}.`);
    }
    await this.assertComplete(actor.schoolId, term, classArmId, subjectId);

    const sheet = await this.prisma.resultSheet.upsert({
      where: { termId_classArmId_subjectId: { termId, classArmId, subjectId } },
      create: {
        schoolId: actor.schoolId,
        termId,
        classArmId,
        subjectId,
        status: ResultSheetStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedById: actor.id,
      },
      update: { status: ResultSheetStatus.SUBMITTED, submittedAt: new Date(), submittedById: actor.id },
    });
    await this.record(actor, "result.submitted", sheet);
    return sheet;
  }

  async review(actor: AuthenticatedStaff, termId: string, classArmId: string, subjectId: string) {
    const term = await this.termFor(actor.schoolId, termId);
    if (!actor.roles.includes(Role.SUPERADMIN)) {
      await this.assertFormTeacher(actor, term.sessionId, classArmId);
    }
    const sheet = await this.requireStatus(actor.schoolId, termId, classArmId, subjectId, ResultSheetStatus.SUBMITTED);
    const reviewed = await this.prisma.resultSheet.update({
      where: { id: sheet.id },
      data: { status: ResultSheetStatus.REVIEWED, reviewedAt: new Date(), reviewedById: actor.id },
    });
    await this.record(actor, "result.reviewed", reviewed);
    return reviewed;
  }

  async approve(actor: AuthenticatedStaff, termId: string, classArmId: string, subjectId: string) {
    this.assertWholeSchool(actor);
    const term = await this.termFor(actor.schoolId, termId);
    const sheet = await this.requireStatus(actor.schoolId, termId, classArmId, subjectId, ResultSheetStatus.REVIEWED);
    const frozen = await this.snapshot(actor.schoolId, term, classArmId, subjectId);

    const approved = await this.prisma.resultSheet.update({
      where: { id: sheet.id },
      data: {
        status: ResultSheetStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: actor.id,
        frozen: frozen as unknown as Prisma.InputJsonValue,
      },
    });
    await this.record(actor, "result.approved", approved);
    return approved;
  }

  /** Reopens a sheet to draft from any later stage. A reason is mandatory and logged. */
  async unlock(actor: AuthenticatedStaff, termId: string, classArmId: string, subjectId: string, reason: string) {
    this.assertWholeSchool(actor);
    const sheet = await this.sheetFor(actor.schoolId, termId, classArmId, subjectId);
    if (!sheet || sheet.status === ResultSheetStatus.DRAFT) {
      throw new ConflictException("These scores are not locked, so there is nothing to reopen.");
    }

    const unlocked = await this.prisma.resultSheet.update({
      where: { id: sheet.id },
      data: {
        status: ResultSheetStatus.DRAFT,
        unlockReason: reason,
        frozen: Prisma.DbNull,
        submittedAt: null,
        submittedById: null,
        reviewedAt: null,
        reviewedById: null,
        approvedAt: null,
        approvedById: null,
        publishedAt: null,
        publishedById: null,
      },
    });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "result.unlocked",
      entityType: "ResultSheet",
      entityId: unlocked.id,
      before: { status: sheet.status },
      after: { status: ResultSheetStatus.DRAFT },
      reason,
    });
    return unlocked;
  }

  /** Publishes every approved sheet in the arm for the term, so the arm goes out together. */
  async publishArm(actor: AuthenticatedStaff, termId: string, classArmId: string) {
    this.assertWholeSchool(actor);
    const term = await this.termFor(actor.schoolId, termId);
    const result = await this.prisma.resultSheet.updateMany({
      where: { schoolId: actor.schoolId, termId, classArmId, status: ResultSheetStatus.APPROVED },
      data: { status: ResultSheetStatus.PUBLISHED, publishedAt: new Date(), publishedById: actor.id },
    });
    const reportCards = result.count > 0 ? await this.reportCards.publish(actor.schoolId, term, classArmId) : 0;
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "result.published",
      entityType: "ClassArm",
      entityId: classArmId,
      after: { termId, sheets: result.count, reportCards },
    });
    return { published: result.count, reportCards };
  }

  private async snapshot(
    schoolId: string,
    term: { id: string; sessionId: string },
    classArmId: string,
    subjectId: string,
  ): Promise<ResultSnapshot> {
    const classArm = await this.prisma.classArm.findFirstOrThrow({
      where: { id: classArmId, schoolId },
      include: { classLevel: true },
    });
    const section = classArm.classLevel.section;

    const [subject, components, gradingScale, enrolments, scores] = await Promise.all([
      this.prisma.subject.findFirstOrThrow({ where: { id: subjectId, schoolId }, select: { name: true } }),
      this.prisma.assessmentComponent.findMany({
        where: { schoolId, termId: term.id, section },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.gradingScale.findUnique({
        where: { schoolId_section: { schoolId, section } },
        include: { bands: true },
      }),
      this.prisma.enrolment.findMany({
        where: { schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
      this.prisma.score.findMany({ where: { schoolId, termId: term.id, subjectId, classArmId } }),
    ]);

    return buildSnapshot({
      subjectName: subject.name,
      components: components.map((component) => ({
        id: component.id,
        name: component.name,
        maxScore: component.maxScore,
      })),
      bands: (gradingScale?.bands ?? []).map((band) => ({
        minScore: band.minScore,
        maxScore: band.maxScore,
        letter: band.letter,
        descriptor: band.descriptor,
      })),
      students: enrolments.map((enrolment) => enrolment.student),
      scores: scores.map((score) => ({
        studentId: score.studentId,
        assessmentComponentId: score.assessmentComponentId,
        value: score.value,
      })),
    });
  }

  /** Every active student must have a value for every component before the teacher can submit. */
  private async assertComplete(
    schoolId: string,
    term: { id: string; sessionId: string; name: string },
    classArmId: string,
    subjectId: string,
  ) {
    const classArm = await this.prisma.classArm.findFirstOrThrow({
      where: { id: classArmId, schoolId },
      include: { classLevel: true },
    });
    const [components, students, filled] = await Promise.all([
      this.prisma.assessmentComponent.count({
        where: { schoolId, termId: term.id, section: classArm.classLevel.section },
      }),
      this.prisma.enrolment.count({
        where: { schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
      }),
      this.prisma.score.count({ where: { schoolId, termId: term.id, subjectId, classArmId } }),
    ]);
    if (components === 0) {
      throw new BadRequestException(`No assessment components are set for ${term.name} yet.`);
    }
    const missing = students * components - filled;
    if (missing > 0) {
      throw new BadRequestException(
        `${missing} score${missing === 1 ? " is" : "s are"} still blank. Fill every cell before submitting.`,
      );
    }
  }

  private async assertCanRead(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    if (actor.roles.some((role) => WHOLE_SCHOOL_APPROVERS.includes(role))) return;
    if (actor.roles.includes(Role.FORM_TEACHER)) {
      const isMine = await this.isFormTeacher(actor.id, sessionId, classArmId);
      if (isMine) return;
    }
    throw new ForbiddenException("You do not have access to this class's approval status.");
  }

  private async assertFormTeacher(actor: AuthenticatedStaff, sessionId: string, classArmId: string) {
    if (!(await this.isFormTeacher(actor.id, sessionId, classArmId))) {
      throw new ForbiddenException("Only this class's form teacher can review its results.");
    }
  }

  private async isFormTeacher(staffId: string, sessionId: string, classArmId: string): Promise<boolean> {
    const assignment = await this.prisma.classAssignment.findUnique({
      where: { sessionId_classArmId: { sessionId, classArmId } },
      select: { staffId: true },
    });
    return assignment?.staffId === staffId;
  }

  private assertWholeSchool(actor: AuthenticatedStaff) {
    if (!actor.roles.some((role) => WHOLE_SCHOOL_APPROVERS.includes(role))) {
      throw new ForbiddenException("Only the principal or superadmin can approve, publish or reopen results.");
    }
  }

  private async termFor(schoolId: string, termId: string) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId } });
    if (!term) throw new NotFoundException("Term not found.");
    return term;
  }

  private sheetFor(schoolId: string, termId: string, classArmId: string, subjectId: string) {
    return this.prisma.resultSheet.findFirst({ where: { schoolId, termId, classArmId, subjectId } });
  }

  private async requireStatus(
    schoolId: string,
    termId: string,
    classArmId: string,
    subjectId: string,
    expected: ResultSheetStatus,
  ): Promise<ResultSheet> {
    const sheet = await this.sheetFor(schoolId, termId, classArmId, subjectId);
    if (!sheet) throw new ConflictException("These scores have not been submitted yet.");
    if (sheet.status !== expected) {
      throw new ConflictException(`These scores are ${label(sheet.status)}, so this step is not available.`);
    }
    return sheet;
  }

  private record(actor: AuthenticatedStaff, action: string, sheet: ResultSheet) {
    return this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action,
      entityType: "ResultSheet",
      entityId: sheet.id,
      after: { status: sheet.status, termId: sheet.termId, classArmId: sheet.classArmId, subjectId: sheet.subjectId },
    });
  }
}

function label(status: ResultSheetStatus): string {
  return status.toLowerCase();
}
