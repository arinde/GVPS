import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { SessionService } from "@/academic/session.service";
import type { CreateSessionDto } from "@/academic/schemas/session.schema";

const SESSION: CreateSessionDto = {
  name: "2026/2027",
  startDate: "2026-09-01",
  endDate: "2027-07-31",
};

describe("SessionService", () => {
  let prisma: {
    academicSession: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
    term: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; updateMany: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: SessionService;

  beforeEach(() => {
    prisma = {
      academicSession: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      term: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      // Run the callback against the same mock so transaction bodies execute.
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    audit = { record: jest.fn() };
    service = new SessionService(prisma as never, audit as never);
  });

  describe("createSession", () => {
    it("rejects a session name that already exists for the school", async () => {
      prisma.academicSession.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.createSession("staff-1", "school-1", SESSION)).rejects.toThrow(ConflictException);
      expect(prisma.academicSession.create).not.toHaveBeenCalled();
    });

    it("creates the session and writes an audit entry", async () => {
      prisma.academicSession.findUnique.mockResolvedValue(null);
      prisma.academicSession.create.mockResolvedValue({ id: "session-1", name: "2026/2027" });

      const created = await service.createSession("staff-1", "school-1", SESSION);

      expect(created.id).toBe("session-1");
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "academic.session.created", entityId: "session-1" }),
      );
    });

    it("creates terms alongside the session in one write", async () => {
      prisma.academicSession.findUnique.mockResolvedValue(null);
      prisma.academicSession.create.mockResolvedValue({ id: "session-1", name: "2026/2027" });

      await service.createSession("staff-1", "school-1", {
        ...SESSION,
        terms: [
          { sequence: 1, name: "First Term", startDate: "2026-09-01", endDate: "2026-12-18" },
          { sequence: 2, name: "Second Term", startDate: "2027-01-05", endDate: "2027-04-02" },
        ],
      });

      const data = prisma.academicSession.create.mock.calls[0][0].data;
      expect(data.terms.create).toHaveLength(2);
      expect(data.terms.create[0]).toEqual(expect.objectContaining({ sequence: 1, schoolId: "school-1" }));
    });

    it("rejects a term that falls outside the session's dates", async () => {
      prisma.academicSession.findUnique.mockResolvedValue(null);

      await expect(
        service.createSession("staff-1", "school-1", {
          ...SESSION,
          // Ends after the session does — a term cannot outlive its session.
          terms: [{ sequence: 3, name: "Third Term", startDate: "2027-04-20", endDate: "2027-09-30" }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.academicSession.create).not.toHaveBeenCalled();
    });
  });

  describe("setCurrentSession", () => {
    it("clears the previous current session in the same transaction", async () => {
      prisma.academicSession.findFirst.mockResolvedValue({ id: "session-2", schoolId: "school-1" });
      prisma.academicSession.update.mockResolvedValue({ id: "session-2", name: "2027/2028" });

      await service.setCurrentSession("staff-1", "school-1", "session-2");

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.academicSession.updateMany).toHaveBeenCalledWith({
        where: { schoolId: "school-1", isCurrent: true },
        data: { isCurrent: false },
      });
      expect(prisma.academicSession.update).toHaveBeenCalledWith({
        where: { id: "session-2" },
        data: { isCurrent: true },
      });
    });

    it("refuses a session belonging to another school", async () => {
      // Scoped lookup returns nothing, so another school's id reads as absent.
      prisma.academicSession.findFirst.mockResolvedValue(null);

      await expect(service.setCurrentSession("staff-1", "school-1", "other-school-session")).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("setCurrentTerm", () => {
    it("clears the previous current term in the same transaction", async () => {
      prisma.term.findFirst.mockResolvedValue({ id: "term-2", schoolId: "school-1" });
      prisma.term.update.mockResolvedValue({ id: "term-2", sessionId: "session-1", sequence: 2 });

      await service.setCurrentTerm("staff-1", "school-1", "term-2");

      expect(prisma.term.updateMany).toHaveBeenCalledWith({
        where: { schoolId: "school-1", isCurrent: true },
        data: { isCurrent: false },
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "academic.term.set_current", entityId: "term-2" }),
      );
    });
  });

  describe("addTerm", () => {
    it("rejects a duplicate sequence within the session", async () => {
      prisma.academicSession.findFirst.mockResolvedValue({
        id: "session-1",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2027-07-31"),
      });
      prisma.term.findUnique.mockResolvedValue({ id: "term-1" });

      await expect(
        service.addTerm("staff-1", "school-1", "session-1", {
          sequence: 1,
          name: "First Term",
          startDate: "2026-09-01",
          endDate: "2026-12-18",
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.term.create).not.toHaveBeenCalled();
    });
  });

  describe("setTimesSchoolOpened", () => {
    it("records the previous value in the audit entry", async () => {
      prisma.term.findFirst.mockResolvedValue({ id: "term-1", schoolId: "school-1", timesSchoolOpened: null });
      prisma.term.update.mockResolvedValue({ id: "term-1", timesSchoolOpened: 62 });

      await service.setTimesSchoolOpened("staff-1", "school-1", "term-1", 62);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "academic.term.updated",
          before: { timesSchoolOpened: null },
          after: { timesSchoolOpened: 62 },
        }),
      );
    });
  });

  describe("getCurrent", () => {
    it("returns nulls when no session or term is current", async () => {
      prisma.academicSession.findFirst.mockResolvedValue(null);
      prisma.term.findFirst.mockResolvedValue(null);

      await expect(service.getCurrent("school-1")).resolves.toEqual({ session: null, term: null });
    });
  });
});
