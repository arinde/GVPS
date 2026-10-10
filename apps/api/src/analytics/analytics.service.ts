import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, ResultSheetStatus, Role } from "@prisma/client";
import { isSnapshot, type ResultSnapshot } from "@/assessment/result-snapshot";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { computeInvoiceBalance } from "@/fees/invoice-balance";
import { PrismaService } from "@/prisma/prisma.service";

// FEATURES.md §14 "Analytics" row: superadmin and principal see all of it;
// bursar sees only the financial card; nobody else has any access.
const ACADEMIC_READERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL];
const FINANCIAL_READERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR];

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** FEATURES.md §10.2 — this session's active roll, by level, by arm, and by sex. */
  async enrolment(actor: AuthenticatedStaff) {
    this.assertAcademic(actor);
    const session = await this.currentSessionOrThrow(actor.schoolId);

    const enrolments = await this.prisma.enrolment.findMany({
      where: { schoolId: actor.schoolId, sessionId: session.id, status: EnrolmentStatus.ACTIVE },
      select: {
        student: { select: { sex: true } },
        classArm: {
          select: { id: true, name: true, classLevel: { select: { id: true, name: true, rank: true } } },
        },
      },
    });

    const byLevel = new Map<string, { name: string; rank: number; count: number }>();
    const byArm = new Map<string, { name: string; rank: number; count: number }>();
    const bySex = { MALE: 0, FEMALE: 0 };
    for (const enrolment of enrolments) {
      const level = enrolment.classArm.classLevel;
      const levelEntry = byLevel.get(level.id) ?? { name: level.name, rank: level.rank, count: 0 };
      levelEntry.count++;
      byLevel.set(level.id, levelEntry);

      const armName = `${level.name}${enrolment.classArm.name}`;
      const armEntry = byArm.get(enrolment.classArm.id) ?? { name: armName, rank: level.rank, count: 0 };
      armEntry.count++;
      byArm.set(enrolment.classArm.id, armEntry);

      bySex[enrolment.student.sex]++;
    }

    return {
      session: session.name,
      total: enrolments.length,
      byLevel: [...byLevel.values()].sort((a, b) => a.rank - b.rank).map(({ name, count }) => ({ name, count })),
      byArm: [...byArm.values()]
        .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
        .map(({ name, count }) => ({ name, count })),
      bySex: [
        { sex: "Male", count: bySex.MALE },
        { sex: "Female", count: bySex.FEMALE },
      ],
    };
  }

  /**
   * FEATURES.md §4.3/§10.1 — the last 14 days' attendance rate school-wide,
   * and this term's rate per class arm (which classes are slipping). A
   * student can carry several period-attendance rows on the same day
   * (Senior); each (student, day) counts once regardless, marked present if
   * any of that day's rows were — the same rule the report card's
   * "times present" already uses.
   */
  async attendance(actor: AuthenticatedStaff) {
    this.assertAcademic(actor);
    const term = await this.currentTermOrThrow(actor.schoolId);

    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [recentRecords, termRecords, arms] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { schoolId: actor.schoolId, date: { gte: since } },
        select: { date: true, studentId: true, status: true },
      }),
      this.prisma.attendance.findMany({
        where: { schoolId: actor.schoolId, termId: term.id },
        select: { classArmId: true, studentId: true, date: true, status: true },
      }),
      this.prisma.classArm.findMany({ where: { schoolId: actor.schoolId }, include: { classLevel: true } }),
    ]);
    const armLabel = new Map(arms.map((arm) => [arm.id, `${arm.classLevel.name}${arm.name}`]));

    const byDate = new Map<string, { present: Set<string>; all: Set<string> }>();
    for (const record of recentRecords) {
      const dateKey = record.date.toISOString().slice(0, 10);
      const bucket = byDate.get(dateKey) ?? { present: new Set<string>(), all: new Set<string>() };
      bucket.all.add(record.studentId);
      if (record.status === "PRESENT" || record.status === "LATE") bucket.present.add(record.studentId);
      byDate.set(dateKey, bucket);
    }

    const byArm = new Map<string, { present: Set<string>; all: Set<string> }>();
    for (const record of termRecords) {
      const comboKey = `${record.studentId}|${record.date.toISOString().slice(0, 10)}`;
      const bucket = byArm.get(record.classArmId) ?? { present: new Set<string>(), all: new Set<string>() };
      bucket.all.add(comboKey);
      if (record.status === "PRESENT" || record.status === "LATE") bucket.present.add(comboKey);
      byArm.set(record.classArmId, bucket);
    }

    return {
      term: term.name,
      daily: [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { present, all }]) => ({
          date,
          percentPresent: all.size ? Math.round((present.size / all.size) * 100) : 0,
        })),
      byArm: [...byArm.entries()]
        .map(([armId, { present, all }]) => ({
          name: armLabel.get(armId) ?? "—",
          percentPresent: all.size ? Math.round((present.size / all.size) * 100) : 0,
        }))
        .sort((a, b) => b.percentPresent - a.percentPresent),
    };
  }

  /** FEATURES.md §10.1 — average score per subject and grade spread, across every published sheet this term. */
  async academic(actor: AuthenticatedStaff) {
    this.assertAcademic(actor);
    const term = await this.currentTermOrThrow(actor.schoolId);

    const sheets = await this.prisma.resultSheet.findMany({
      where: { schoolId: actor.schoolId, termId: term.id, status: ResultSheetStatus.PUBLISHED },
      select: { subjectId: true, frozen: true },
    });
    const subjectIds = [...new Set(sheets.map((sheet) => sheet.subjectId))];
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const subjectName = new Map(subjects.map((subject) => [subject.id, subject.name]));

    const bySubject = new Map<string, { name: string; sum: number; count: number }>();
    const gradeCounts = new Map<string, number>();

    for (const sheet of sheets) {
      const snapshot = sheet.frozen;
      if (!isSnapshot(snapshot)) continue;
      const typed = snapshot as ResultSnapshot;
      const entry = bySubject.get(sheet.subjectId) ?? {
        name: subjectName.get(sheet.subjectId) ?? "—",
        sum: 0,
        count: 0,
      };
      for (const row of typed.rows) {
        if (row.maxTotal > 0) {
          entry.sum += (row.total / row.maxTotal) * 100;
          entry.count++;
        }
        if (row.grade) gradeCounts.set(row.grade.letter, (gradeCounts.get(row.grade.letter) ?? 0) + 1);
      }
      bySubject.set(sheet.subjectId, entry);
    }

    return {
      term: term.name,
      bySubject: [...bySubject.values()]
        .map(({ name, sum, count }) => ({ name, averagePercent: count ? Math.round((sum / count) * 10) / 10 : 0 }))
        .sort((a, b) => b.averagePercent - a.averagePercent),
      gradeDistribution: [...gradeCounts.entries()]
        .map(([letter, count]) => ({ letter, count }))
        .sort((a, b) => a.letter.localeCompare(b.letter)),
    };
  }

  /** FEATURES.md §10.3/§6.6 — expected, collected and outstanding this term, across the whole school. */
  async financial(actor: AuthenticatedStaff) {
    this.assertFinancial(actor);
    const term = await this.currentTermOrThrow(actor.schoolId);

    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId: actor.schoolId, termId: term.id },
      include: { lineItems: true, payments: true },
    });

    let totalDue = 0;
    let totalPaid = 0;
    for (const invoice of invoices) {
      const balance = computeInvoiceBalance(invoice);
      totalDue += balance.totalDue;
      totalPaid += balance.totalPaid;
    }

    return {
      term: term.name,
      expectedKobo: totalDue,
      collectedKobo: totalPaid,
      outstandingKobo: Math.max(totalDue - totalPaid, 0),
    };
  }

  private assertAcademic(actor: AuthenticatedStaff) {
    if (!actor.roles.some((role) => ACADEMIC_READERS.includes(role))) {
      throw new ForbiddenException("You do not have access to analytics.");
    }
  }

  private assertFinancial(actor: AuthenticatedStaff) {
    if (!actor.roles.some((role) => FINANCIAL_READERS.includes(role))) {
      throw new ForbiddenException("You do not have access to financial analytics.");
    }
  }

  private async currentSessionOrThrow(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    if (!session) throw new NotFoundException("No current academic session is set.");
    return session;
  }

  private async currentTermOrThrow(schoolId: string) {
    const term = await this.prisma.term.findFirst({ where: { schoolId, isCurrent: true } });
    if (!term) throw new NotFoundException("No current term is set.");
    return term;
  }
}
