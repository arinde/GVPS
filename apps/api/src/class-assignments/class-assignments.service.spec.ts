import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { ClassAssignmentsService, MAX_CLASSES_PER_TEACHER } from "@/class-assignments/class-assignments.service";

const ARM = { id: "p3a", name: "A", classLevel: { name: "Primary 3" } };
const teacher = (roles: Role[] = [Role.FORM_TEACHER]) => ({
  id: "teacher-1",
  email: "ngozi@school.test",
  firstName: "Ngozi",
  lastName: "Okafor",
  roles: roles.map((role) => ({ role })),
});

describe("ClassAssignmentsService.setClassTeacher", () => {
  let prisma: {
    academicSession: { findFirst: jest.Mock };
    classArm: { findFirst: jest.Mock; findMany: jest.Mock };
    classAssignment: { findUnique: jest.Mock; findMany: jest.Mock; delete: jest.Mock; create: jest.Mock };
    staff: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: ClassAssignmentsService;

  beforeEach(() => {
    prisma = {
      academicSession: { findFirst: jest.fn().mockResolvedValue({ id: "session-1", name: "2026/2027" }) },
      classArm: { findFirst: jest.fn().mockResolvedValue(ARM), findMany: jest.fn() },
      classAssignment: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: "assignment-1", staffId: "teacher-1" }),
      },
      staff: { findFirst: jest.fn().mockResolvedValue(teacher()) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    audit = { record: jest.fn() };
    service = new ClassAssignmentsService(prisma as never, audit as never);
  });

  it("puts a form teacher in charge of a class for the current session", async () => {
    await service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1");

    expect(prisma.classAssignment.create).toHaveBeenCalledWith({
      data: { schoolId: "school-1", sessionId: "session-1", classArmId: "p3a", staffId: "teacher-1" },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "class.teacher.set", after: expect.objectContaining({ class: "Primary 3A" }) }),
    );
  });

  it("replaces the previous teacher in one transaction", async () => {
    prisma.classAssignment.findUnique.mockResolvedValue({ id: "old", staffId: "teacher-0" });

    await service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.classAssignment.delete).toHaveBeenCalledWith({ where: { id: "old" } });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ before: { staffId: "teacher-0" } }));
  });

  it("changes nothing when the class already has that teacher", async () => {
    prisma.classAssignment.findUnique.mockResolvedValue({ id: "same", staffId: "teacher-1" });

    await service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1");

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it("clears a class's teacher when given null", async () => {
    prisma.classAssignment.findUnique.mockResolvedValue({ id: "old", staffId: "teacher-0" });

    const result = await service.setClassTeacher("admin-1", "school-1", "p3a", null);

    expect(result).toBeNull();
    expect(prisma.classAssignment.delete).toHaveBeenCalled();
    expect(prisma.classAssignment.create).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "class.teacher.cleared" }));
  });

  it(`refuses a teacher who already has ${MAX_CLASSES_PER_TEACHER} classes, naming them`, async () => {
    prisma.classAssignment.findMany.mockResolvedValue([
      { classArm: { name: "A", classLevel: { name: "Primary 1" } } },
      { classArm: { name: "B", classLevel: { name: "Primary 1" } } },
    ]);

    await expect(service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1")).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1")).rejects.toMatchObject({
      response: {
        message: [
          expect.objectContaining({ path: ["staffId"], message: expect.stringMatching(/Primary 1A and Primary 1B/) }),
        ],
      },
    });
    expect(prisma.classAssignment.create).not.toHaveBeenCalled();
  });

  it("does not count the class being reassigned towards the limit", async () => {
    await service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1");

    expect(prisma.classAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ classArmId: { not: "p3a" } }) }),
    );
  });

  it("refuses someone who is not a form teacher", async () => {
    prisma.staff.findFirst.mockResolvedValue(teacher([Role.BURSAR]));

    await expect(service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1")).rejects.toMatchObject({
      response: { message: [expect.objectContaining({ message: expect.stringMatching(/not a form teacher/) })] },
    });
  });

  it("refuses a staff member from another school", async () => {
    prisma.staff.findFirst.mockResolvedValue(null);

    await expect(service.setClassTeacher("admin-1", "school-1", "p3a", "stranger")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("refuses a class from another school", async () => {
    prisma.classArm.findFirst.mockResolvedValue(null);

    await expect(service.setClassTeacher("admin-1", "school-1", "elsewhere", "teacher-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("refuses when no session is current", async () => {
    prisma.academicSession.findFirst.mockResolvedValue(null);

    await expect(service.setClassTeacher("admin-1", "school-1", "p3a", "teacher-1")).rejects.toThrow(
      /No current academic session/,
    );
  });
});
