import { NotFoundException } from "@nestjs/common";
import { StaffAccountService } from "@/auth/staff-account.service";

// Reading staff records: the list and the single profile. Kept apart from
// staff-account.service.spec.ts, which covers the writes.
describe("StaffAccountService reads", () => {
  let prisma: {
    academicSession: { findFirst: jest.Mock };
    staff: { findMany: jest.Mock; findFirst: jest.Mock };
  };
  let service: StaffAccountService;

  beforeEach(() => {
    prisma = {
      academicSession: { findFirst: jest.fn().mockResolvedValue({ id: "session-1" }) },
      staff: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn() },
    };
    service = new StaffAccountService(prisma as never, { record: jest.fn() } as never);
  });

  describe("listStaff", () => {
    it("never selects salary account details or password internals", async () => {
      await service.listStaff("school-1");

      const select = prisma.staff.findMany.mock.calls[0][0].select;
      for (const field of ["accountNumber", "accountName", "bankName", "passwordHash", "failedLoginAttempts"]) {
        expect(select).not.toHaveProperty(field);
      }
    });

    it("lists only the caller's school", async () => {
      await service.listStaff("school-1");

      expect(prisma.staff.findMany.mock.calls[0][0].where).toEqual({ schoolId: "school-1" });
    });

    it("shows allocations for the current session only", async () => {
      await service.listStaff("school-1");

      const assignments = prisma.staff.findMany.mock.calls[0][0].select.classAssignments;
      expect(assignments.where).toEqual({ sessionId: "session-1" });
    });
  });

  describe("getProfile", () => {
    it("returns the salary account for the superadmin's profile view", async () => {
      prisma.staff.findFirst.mockResolvedValue({ id: "staff-1", accountNumber: "0123456789" });

      await expect(service.getProfile("school-1", "staff-1")).resolves.toMatchObject({ accountNumber: "0123456789" });
      expect(prisma.staff.findFirst.mock.calls[0][0].select).not.toHaveProperty("passwordHash");
    });

    it("treats a staff member from another school as not found", async () => {
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(service.getProfile("school-1", "elsewhere")).rejects.toThrow(NotFoundException);
      expect(prisma.staff.findFirst.mock.calls[0][0].where).toEqual({ id: "elsewhere", schoolId: "school-1" });
    });
  });
});
