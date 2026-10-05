import { Injectable } from "@nestjs/common";
import { EnrolmentStatus, ResultSheetStatus, type Prisma, type Term } from "@prisma/client";
import { isSnapshot, type ResultSnapshot } from "@/assessment/result-snapshot";
import { buildReportCards, isReportCard, type RemarkInput } from "@/assessment/report-card";
import { fetchStudentLedger } from "@/fees/invoicing.service";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * FEATURES.md §5.5 and §5.8 — builds and stores every report card for one
 * class in one term from the sheets published so far. Runs at publish time, so
 * what a parent later reads is exactly what was computed then.
 */
@Injectable()
export class ReportCardPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async publish(schoolId: string, term: Term, classArmId: string): Promise<number> {
    const classArm = await this.prisma.classArm.findFirstOrThrow({
      where: { id: classArmId, schoolId },
      include: { classLevel: true },
    });
    const section = classArm.classLevel.section;

    const [sheets, enrolments, remarks, gradingScale, sessionTerms] = await Promise.all([
      this.prisma.resultSheet.findMany({
        where: { schoolId, termId: term.id, classArmId, status: ResultSheetStatus.PUBLISHED },
        select: { subjectId: true, frozen: true },
      }),
      this.prisma.enrolment.findMany({
        where: { schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
      this.prisma.studentRemark.findMany({ where: { schoolId, termId: term.id, classArmId } }),
      this.prisma.gradingScale.findUnique({ where: { schoolId_section: { schoolId, section } } }),
      this.prisma.term.findMany({
        where: { schoolId, sessionId: term.sessionId, sequence: { lt: term.sequence } },
        select: { id: true },
      }),
    ]);

    const subjects = sheets.flatMap((sheet) => {
      const snapshot = sheet.frozen;
      return isSnapshot(snapshot) ? [{ subjectId: sheet.subjectId, snapshot: snapshot as ResultSnapshot }] : [];
    });
    const students = enrolments.map((enrolment) => ({
      studentId: enrolment.student.id,
      name: `${enrolment.student.lastName}, ${enrolment.student.firstName}`,
      admissionNo: enrolment.student.admissionNo,
    }));

    const priorAverages = await this.priorAverages(
      schoolId,
      sessionTerms.map((candidate) => candidate.id),
      students.map((student) => student.studentId),
    );

    const feeBalanceKobo = new Map<string, number>();
    for (const student of students) {
      const ledger = await fetchStudentLedger(this.prisma, schoolId, student.studentId);
      feeBalanceKobo.set(student.studentId, ledger.outstanding);
    }

    const cards = buildReportCards({
      term: { name: term.name, sequence: term.sequence, timesSchoolOpened: term.timesSchoolOpened },
      classLabel: `${classArm.classLevel.name}${classArm.name}`,
      students,
      subjects,
      remarks: new Map(remarks.map((remark) => [remark.studentId, toRemarkInput(remark)])),
      priorAverages,
      promotionThreshold: gradingScale?.promotionThreshold ?? null,
      feeBalanceKobo,
      publishedAt: new Date(),
    });

    for (const [studentId, card] of cards) {
      await this.prisma.reportCard.upsert({
        where: { termId_studentId: { termId: term.id, studentId } },
        create: { schoolId, termId: term.id, studentId, classArmId, frozen: card as unknown as Prisma.InputJsonValue },
        update: { classArmId, frozen: card as unknown as Prisma.InputJsonValue, publishedAt: new Date() },
      });
    }
    return cards.size;
  }

  /** Each student's term averages from the report cards already published earlier in the session. */
  private async priorAverages(
    schoolId: string,
    earlierTermIds: string[],
    studentIds: string[],
  ): Promise<Map<string, number[]>> {
    const averages = new Map<string, number[]>();
    if (earlierTermIds.length === 0 || studentIds.length === 0) return averages;

    const cards = await this.prisma.reportCard.findMany({
      where: { schoolId, termId: { in: earlierTermIds }, studentId: { in: studentIds } },
      select: { studentId: true, frozen: true },
    });
    for (const card of cards) {
      const frozen = card.frozen;
      if (!isReportCard(frozen)) continue;
      const list = averages.get(card.studentId) ?? [];
      list.push(frozen.totals.average);
      averages.set(card.studentId, list);
    }
    return averages;
  }
}

function toRemarkInput(remark: {
  formComment: string | null;
  principalComment: string | null;
  traits: Prisma.JsonValue;
}): RemarkInput {
  return {
    formComment: remark.formComment,
    principalComment: remark.principalComment,
    traits: isTraitMap(remark.traits) ? remark.traits : null,
  };
}

function isTraitMap(value: Prisma.JsonValue): value is Record<string, number> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
