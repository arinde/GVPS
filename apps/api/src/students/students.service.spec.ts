import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GuardianRelationship, Section, Sex, Stream } from "@prisma/client";
import { resolveStream, StudentsService, withOnePrimary } from "@/students/students.service";
import { CreateStudentSchema, type CreateStudentDto } from "@/students/schemas/create-student.schema";

function dto(overrides: Partial<CreateStudentDto> = {}): CreateStudentDto {
  return CreateStudentSchema.parse({
    firstName: "Fatima",
    lastName: "Ibrahim",
    dateOfBirth: "2014-05-12",
    sex: Sex.FEMALE,
    dateOfAdmission: "2026-09-01",
    classArmId: "arm-1",
    guardians: [
      { firstName: "Musa", lastName: "Ibrahim", phone: "08012345678", relationship: "FATHER", isPrimary: true },
    ],
    ...overrides,
  });
}

describe("StudentsService", () => {
  let prisma: {
    school: { findUniqueOrThrow: jest.Mock };
    classArm: { findFirst: jest.Mock };
    academicSession: { findFirst: jest.Mock };
    student: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
    guardian: { upsert: jest.Mock };
    studentGuardian: { create: jest.Mock };
    enrolment: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let admissionNumbers: { allocate: jest.Mock };
  let service: StudentsService;

  beforeEach(() => {
    prisma = {
      school: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "school-1" }) },
      classArm: {
        findFirst: jest.fn().mockResolvedValue({
          id: "arm-1",
          classLevelId: "level-1",
          name: "A",
          stream: null,
          classLevel: { name: "Primary 4", section: "PRIMARY" },
        }),
      },
      academicSession: { findFirst: jest.fn().mockResolvedValue({ id: "session-1", name: "2026/2027" }) },
      student: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: "student-1", admissionNo: "GVPS/2026/0001" }),
      },
      guardian: { upsert: jest.fn().mockResolvedValue({ id: "guardian-1" }) },
      studentGuardian: { create: jest.fn() },
      enrolment: { create: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    audit = { record: jest.fn() };
    admissionNumbers = { allocate: jest.fn().mockResolvedValue("GVPS/2026/0001") };
    service = new StudentsService(prisma as never, audit as never, admissionNumbers as never);
  });

  describe("register", () => {
    it("creates the student and an enrolment in the current session", async () => {
      const student = await service.register("staff-1", "school-1", dto());

      expect(student.admissionNo).toBe("GVPS/2026/0001");
      expect(prisma.enrolment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ studentId: "student-1", sessionId: "session-1", classArmId: "arm-1" }),
        }),
      );
    });

    it("refuses to register when no session is current", async () => {
      // Without an enrolment the student is invisible to every screen that
      // filters by the current session, so this must fail loudly.
      prisma.academicSession.findFirst.mockResolvedValue(null);

      await expect(service.register("staff-1", "school-1", dto())).rejects.toThrow(BadRequestException);
      expect(prisma.student.create).not.toHaveBeenCalled();
    });

    it("derives the admitted level from the arm so the two cannot disagree", async () => {
      await service.register("staff-1", "school-1", dto());

      expect(prisma.student.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ admittedIntoLevelId: "level-1" }) }),
      );
    });

    it("rejects a duplicate on name plus date of birth", async () => {
      prisma.student.findFirst.mockResolvedValue({ id: "existing", admissionNo: "GVPS/2025/0007" });

      await expect(service.register("staff-1", "school-1", dto())).rejects.toThrow(/GVPS\/2025\/0007/);
      expect(prisma.student.create).not.toHaveBeenCalled();
    });

    it("rejects an arm from another school", async () => {
      prisma.classArm.findFirst.mockResolvedValue(null);

      await expect(service.register("staff-1", "school-1", dto())).rejects.toThrow(NotFoundException);
    });

    it("allocates the admission number inside the transaction", async () => {
      await service.register("staff-1", "school-1", dto());

      // Allocation outside the transaction would let two concurrent
      // registrations read the same counter value.
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(admissionNumbers.allocate).toHaveBeenCalledWith(prisma, { id: "school-1" }, new Date("2026-09-01"));
    });

    it("reuses an existing guardian rather than cloning them", async () => {
      await service.register(
        "staff-1",
        "school-1",
        dto({
          guardians: [
            {
              firstName: "Musa",
              lastName: "Ibrahim",
              phone: "08012345678",
              relationship: GuardianRelationship.FATHER,
              isPrimary: true,
            },
          ],
        } as Partial<CreateStudentDto>),
      );

      expect(prisma.guardian.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId_phone: { schoolId: "school-1", phone: "+2348012345678" } },
        }),
      );
      expect(prisma.studentGuardian.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ guardianId: "guardian-1", isPrimary: true }) }),
      );
    });

    it("writes an audit entry naming the admission number and arm", async () => {
      await service.register("staff-1", "school-1", dto());

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "student.registered",
          after: expect.objectContaining({ admissionNo: "GVPS/2026/0001", arm: "Primary 4A" }),
        }),
      );
    });
  });

  describe("search", () => {
    it("asks for one more row than the limit to detect a next page", async () => {
      await service.search("school-1", { limit: 50 });

      expect(prisma.student.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 51 }));
    });

    it("returns a cursor only when there are more rows", async () => {
      prisma.student.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);

      const page = await service.search("school-1", { limit: 2 });

      expect(page.nextCursor).toBeNull();
      expect(page.students).toHaveLength(2);
    });
  });
});

describe("CreateStudentSchema", () => {
  it("normalises a local phone number to +234", () => {
    const parsed = dto({
      guardians: [
        {
          firstName: "Musa",
          lastName: "Ibrahim",
          phone: "0801 234 5678",
          relationship: GuardianRelationship.FATHER,
          isPrimary: false,
        },
      ],
    } as Partial<CreateStudentDto>);

    expect(parsed.guardians[0].phone).toBe("+2348012345678");
  });

  it("rejects a birth date after the admission date", () => {
    expect(() => dto({ dateOfBirth: "2027-01-01" })).toThrow();
  });

  it("rejects two primary guardians", () => {
    expect(() =>
      dto({
        guardians: [
          { firstName: "A", lastName: "B", phone: "08012345678", relationship: "FATHER", isPrimary: true },
          { firstName: "C", lastName: "D", phone: "08087654321", relationship: "MOTHER", isPrimary: true },
        ],
      } as Partial<CreateStudentDto>),
    ).toThrow();
  });
});

describe("CreateStudentSchema — school rules", () => {
  it("requires at least one guardian", () => {
    expect(() => dto({ guardians: [] })).toThrow(/at least one parent or guardian/i);
  });

  it("accepts a real state and one of its LGAs", () => {
    expect(() => dto({ stateOfOrigin: "Kano", lga: "Fagge" })).not.toThrow();
  });

  it("rejects an LGA from a different state", () => {
    expect(() => dto({ stateOfOrigin: "Lagos", lga: "Fagge" })).toThrow(/not in the chosen state/);
  });

  it("rejects an LGA with no state", () => {
    expect(() => dto({ lga: "Ikeja" })).toThrow(/state first/);
  });

  it("rejects a state that is not on the list", () => {
    expect(() => dto({ stateOfOrigin: "Kastina" })).toThrow(/from the list/);
  });

  it.each(["A+", "O-", "AB+"])("accepts blood group %s", (group) => {
    expect(dto({ bloodGroup: group } as Partial<CreateStudentDto>).bloodGroup).toBe(group);
  });

  it("rejects a free-typed blood group", () => {
    expect(() => dto({ bloodGroup: "O positive" } as unknown as Partial<CreateStudentDto>)).toThrow(
      /blood group from the list/,
    );
  });
});

describe("resolveStream", () => {
  const level = (section: Section) => ({ id: "l", name: "SSS 1", section, rank: 10 }) as never;
  const arm = (section: Section, stream: Stream | null = null) =>
    ({ id: "a", name: "A", stream, classLevel: level(section) }) as never;

  it("requires a department for a senior student", () => {
    expect(() => resolveStream(arm(Section.SENIOR))).toThrow();
  });

  it("records the chosen department for a senior student", () => {
    expect(resolveStream(arm(Section.SENIOR), Stream.COMMERCIAL)).toBe(Stream.COMMERCIAL);
  });

  it("rejects a department for a junior student", () => {
    expect(() => resolveStream(arm(Section.JUNIOR), Stream.SCIENCE)).toThrow();
  });

  it("records no department for a primary student", () => {
    expect(resolveStream(arm(Section.PRIMARY))).toBeNull();
  });

  it("takes the department from a stream-tagged arm", () => {
    expect(resolveStream(arm(Section.SENIOR, Stream.ARTS))).toBe(Stream.ARTS);
  });

  it("rejects a choice that contradicts the arm's stream", () => {
    expect(() => resolveStream(arm(Section.SENIOR, Stream.ARTS), Stream.SCIENCE)).toThrow(BadRequestException);
  });

  it("reports the error against the department field", () => {
    try {
      resolveStream(arm(Section.SENIOR));
    } catch (error) {
      expect((error as { getResponse: () => { message: unknown } }).getResponse().message).toEqual([
        { path: ["stream"], message: "Choose a department for a senior student" },
      ]);
    }
  });
});

describe("withOnePrimary", () => {
  const g = (isPrimary: boolean) =>
    ({ firstName: "A", lastName: "B", phone: "+2348012345678", relationship: "FATHER", isPrimary }) as never;

  it("makes the first guardian primary when none is marked", () => {
    expect(withOnePrimary([g(false), g(false)]).map((x) => x.isPrimary)).toEqual([true, false]);
  });

  it("keeps an existing primary choice", () => {
    expect(withOnePrimary([g(false), g(true)]).map((x) => x.isPrimary)).toEqual([false, true]);
  });
});
