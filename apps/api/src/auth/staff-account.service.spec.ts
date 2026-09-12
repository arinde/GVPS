import { ConflictException, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { StaffAccountService } from "@/auth/staff-account.service";

jest.mock("argon2");

const mockedArgon2 = jest.mocked(argon2);

describe("StaffAccountService", () => {
  let prisma: {
    staff: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    staffRole: { upsert: jest.Mock; deleteMany: jest.Mock };
    refreshToken: { updateMany: jest.Mock };
  };
  let audit: { record: jest.Mock };
  let service: StaffAccountService;

  beforeEach(() => {
    prisma = {
      staff: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      staffRole: { upsert: jest.fn(), deleteMany: jest.fn() },
      refreshToken: { updateMany: jest.fn() },
    };
    audit = { record: jest.fn() };
    service = new StaffAccountService(prisma as never, audit as never);
    mockedArgon2.hash.mockReset().mockResolvedValue("hashed" as never);
  });

  describe("createStaff", () => {
    it("rejects a duplicate email within the same school", async () => {
      prisma.staff.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.createStaff("admin-1", "school-1", "taken@example.com", ["FORM_TEACHER"])).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.staff.create).not.toHaveBeenCalled();
    });

    it("creates the staff record and writes an audit entry", async () => {
      prisma.staff.findUnique.mockResolvedValue(null);
      prisma.staff.create.mockResolvedValue({ id: "new-staff" });

      const result = await service.createStaff("admin-1", "school-1", "new@example.com", ["FORM_TEACHER"]);

      expect(result.staffId).toBe("new-staff");
      expect(typeof result.temporaryPassword).toBe("string");
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "staff.create", entityId: "new-staff", actorStaffId: "admin-1" }),
      );
    });
  });

  describe("grantRole / revokeRole", () => {
    it("rejects when the staff account doesn't belong to the actor's school", async () => {
      prisma.staff.findUnique.mockResolvedValue({ id: "staff-2", schoolId: "other-school" });

      await expect(service.grantRole("admin-1", "school-1", "staff-2", "BURSAR")).rejects.toThrow(NotFoundException);
    });

    it("upserts the role and logs it", async () => {
      prisma.staff.findUnique.mockResolvedValue({ id: "staff-2", schoolId: "school-1" });

      await service.grantRole("admin-1", "school-1", "staff-2", "BURSAR");

      expect(prisma.staffRole.upsert).toHaveBeenCalledWith({
        where: { staffId_role: { staffId: "staff-2", role: "BURSAR" } },
        create: { staffId: "staff-2", role: "BURSAR" },
        update: {},
      });
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "staff.role.grant" }));
    });

    it("removes the role and logs it", async () => {
      prisma.staff.findUnique.mockResolvedValue({ id: "staff-2", schoolId: "school-1" });

      await service.revokeRole("admin-1", "school-1", "staff-2", "BURSAR");

      expect(prisma.staffRole.deleteMany).toHaveBeenCalledWith({ where: { staffId: "staff-2", role: "BURSAR" } });
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "staff.role.revoke" }));
    });
  });

  describe("resetPassword", () => {
    it("sets mustChangePassword and revokes every existing session", async () => {
      prisma.staff.findUnique.mockResolvedValue({ id: "staff-2", schoolId: "school-1" });

      const result = await service.resetPassword("admin-1", "school-1", "staff-2");

      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: "staff-2" },
        data: { passwordHash: "hashed", mustChangePassword: true },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { staffId: "staff-2", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(typeof result.temporaryPassword).toBe("string");
    });
  });
});
