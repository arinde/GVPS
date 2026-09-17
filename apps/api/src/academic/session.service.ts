import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AcademicSession, Term } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { PrismaService } from "@/prisma/prisma.service";
import type { CreateSessionDto, TermInputDto } from "@/academic/schemas/session.schema";

export type CurrentAcademicPeriod = {
  session: AcademicSession | null;
  term: Term | null;
};

/**
 * Sessions and terms (FEATURES.md §2.1).
 *
 * Levels and arms are deliberately not session-scoped, so "rollover carries
 * the structure forward" (TESTS.md §7.1) needs no copying — Primary 4A is the
 * same arm next year. Rollover here is therefore just creating the next
 * session and its terms, which is why `createSession` takes them inline and
 * writes both in one transaction.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createSession(actorStaffId: string, schoolId: string, dto: CreateSessionDto): Promise<AcademicSession> {
    const existing = await this.prisma.academicSession.findUnique({
      where: { schoolId_name: { schoolId, name: dto.name } },
    });
    if (existing) throw new ConflictException(`Session ${dto.name} already exists.`);

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    for (const term of dto.terms ?? []) assertTermWithinSession(term, start, end);

    const session = await this.prisma.academicSession.create({
      data: {
        schoolId,
        name: dto.name,
        startDate: start,
        endDate: end,
        terms: {
          create: (dto.terms ?? []).map((term) => ({
            schoolId,
            sequence: term.sequence,
            name: term.name,
            startDate: new Date(term.startDate),
            endDate: new Date(term.endDate),
            timesSchoolOpened: term.timesSchoolOpened,
          })),
        },
      },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.session.created",
      entityType: "AcademicSession",
      entityId: session.id,
      after: { name: session.name, terms: dto.terms?.length ?? 0 },
    });

    return session;
  }

  listSessions(schoolId: string) {
    return this.prisma.academicSession.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { sequence: "asc" } } },
    });
  }

  async addTerm(actorStaffId: string, schoolId: string, sessionId: string, dto: TermInputDto): Promise<Term> {
    const session = await this.findSessionOrThrow(schoolId, sessionId);
    assertTermWithinSession(dto, session.startDate, session.endDate);

    const clash = await this.prisma.term.findUnique({
      where: { sessionId_sequence: { sessionId, sequence: dto.sequence } },
    });
    if (clash) throw new ConflictException(`Term ${dto.sequence} already exists for this session.`);

    const term = await this.prisma.term.create({
      data: {
        schoolId,
        sessionId,
        sequence: dto.sequence,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        timesSchoolOpened: dto.timesSchoolOpened,
      },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.term.created",
      entityType: "Term",
      entityId: term.id,
      after: { sessionId, sequence: term.sequence, name: term.name },
    });

    return term;
  }

  /**
   * Both setters clear the old flag and set the new one inside a transaction.
   * The database has a partial unique index on (schoolId) WHERE isCurrent, so
   * doing this in two separate writes would fail on the index rather than
   * silently leaving two current rows — the transaction is what makes the
   * swap legal, not merely tidy.
   */
  async setCurrentSession(actorStaffId: string, schoolId: string, sessionId: string): Promise<AcademicSession> {
    await this.findSessionOrThrow(schoolId, sessionId);

    const session = await this.prisma.$transaction(async (tx) => {
      await tx.academicSession.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
      return tx.academicSession.update({ where: { id: sessionId }, data: { isCurrent: true } });
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.session.set_current",
      entityType: "AcademicSession",
      entityId: session.id,
      after: { name: session.name },
    });

    return session;
  }

  async setCurrentTerm(actorStaffId: string, schoolId: string, termId: string): Promise<Term> {
    const existing = await this.findTermOrThrow(schoolId, termId);

    const term = await this.prisma.$transaction(async (tx) => {
      await tx.term.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
      return tx.term.update({ where: { id: existing.id }, data: { isCurrent: true } });
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.term.set_current",
      entityType: "Term",
      entityId: term.id,
      after: { sessionId: term.sessionId, sequence: term.sequence },
    });

    return term;
  }

  /** The times-school-opened figure, which is only known once a term has run. */
  async setTimesSchoolOpened(
    actorStaffId: string,
    schoolId: string,
    termId: string,
    timesSchoolOpened: number,
  ): Promise<Term> {
    const existing = await this.findTermOrThrow(schoolId, termId);

    const term = await this.prisma.term.update({
      where: { id: existing.id },
      data: { timesSchoolOpened },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.term.updated",
      entityType: "Term",
      entityId: term.id,
      before: { timesSchoolOpened: existing.timesSchoolOpened },
      after: { timesSchoolOpened },
    });

    return term;
  }

  async getCurrent(schoolId: string): Promise<CurrentAcademicPeriod> {
    const [session, term] = await Promise.all([
      this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } }),
      this.prisma.term.findFirst({ where: { schoolId, isCurrent: true } }),
    ]);
    return { session, term };
  }

  private async findSessionOrThrow(schoolId: string, sessionId: string): Promise<AcademicSession> {
    // Scoped by schoolId, never by id alone (PLAN.md §4.1) — an id from
    // another school must read as absent, not as forbidden.
    const session = await this.prisma.academicSession.findFirst({ where: { id: sessionId, schoolId } });
    if (!session) throw new NotFoundException("Session not found.");
    return session;
  }

  private async findTermOrThrow(schoolId: string, termId: string): Promise<Term> {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId } });
    if (!term) throw new NotFoundException("Term not found.");
    return term;
  }
}

function assertTermWithinSession(term: TermInputDto, sessionStart: Date, sessionEnd: Date): void {
  if (new Date(term.startDate) < sessionStart || new Date(term.endDate) > sessionEnd) {
    throw new BadRequestException(`Term "${term.name}" falls outside the session's dates.`);
  }
}
