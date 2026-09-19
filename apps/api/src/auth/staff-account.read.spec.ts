import { NotFoundException } from "@nestjs/common";
import { StaffAccountService } from "@/auth/staff-account.service";

describe("StaffAccountService reads", () => {
  function setup() {
    const prisma = {
      academicSession: { findFirst: jest.fn().mockResolvedValue({ id: "session-1" }) },
      staff: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn() },
    };
    const service = new StaffAccountService(prisma as never, { record: jest.fn() } as never);
    return { prisma, service };
  }

  it("never selects salary account fields for the staff list", async () => {
    const { prisma, service } = setup();

    await service.listStaff("school-1");

    const select = prisma.staff.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("accountNumber");
    expect(select).not.toHaveProperty("accountName");
    expect(select).not.toHaveProperty("bankName");
    expect(select).not.toHaveProperty("passwordHash");
  });

  it("includes the salary account in one staff member's profile", async () => {
    const { prisma, service } = setup();
    prisma.staff.findFirst.mockResolvedValue({ id: "s1", accountNumber: "0123456789" });

    await service.getProfile("school-1", "s1");

    const query = prisma.staff.findFirst.mock.calls[0][0];
    expect(query.where).toEqual({ id: "s1", schoolId: "school-1" });
    expect(query.select).toMatchObject({ accountNumber: true, bankName: true, accountName: true });
    expect(query.select).not.toHaveProperty("passwordHash");
  });

  it("reports a staff member from another school as not found", async () => {
    const { prisma, service } = setup();
    prisma.staff.findFirst.mockResolvedValue(null);

    await expect(service.getProfile("school-1", "elsewhere")).rejects.toThrow(NotFoundException);
  });
});
