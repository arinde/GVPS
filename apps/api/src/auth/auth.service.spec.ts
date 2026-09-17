import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthService } from "@/auth/auth.service";

jest.mock("argon2");

const mockedArgon2 = jest.mocked(argon2);

function buildStaff(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "staff-1",
    schoolId: "school-1",
    email: "teacher@example.com",
    passwordHash: "hashed",
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ role: "FORM_TEACHER" }],
    ...overrides,
  };
}

describe("AuthService", () => {
  let prisma: {
    staff: { findFirst: jest.Mock; update: jest.Mock; findUniqueOrThrow: jest.Mock };
    refreshToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      staff: { findFirst: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
      refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue("signed-jwt") };
    config = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn().mockReturnValue("test-secret"),
    };
    service = new AuthService(prisma as never, jwt as never, config as never);
    jest.clearAllMocks();
    mockedArgon2.verify.mockReset();
  });

  describe("login", () => {
    it("rejects an unknown email without revealing that it doesn't exist", async () => {
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(service.login("nobody@example.com", "pw")).rejects.toThrow(UnauthorizedException);
    });

    it("rejects while locked, without checking the password", async () => {
      const staff = buildStaff({ lockedUntil: new Date(Date.now() + 60_000) });
      prisma.staff.findFirst.mockResolvedValue(staff);

      await expect(service.login(staff.email, "pw")).rejects.toThrow(ForbiddenException);
      expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });

    it("increments failedLoginAttempts on a wrong password", async () => {
      const staff = buildStaff({ failedLoginAttempts: 1 });
      prisma.staff.findFirst.mockResolvedValue(staff);
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(service.login(staff.email, "wrong")).rejects.toThrow(UnauthorizedException);

      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: staff.id },
        data: { failedLoginAttempts: 2, lockedUntil: null },
      });
    });

    it("locks the account once failures hit the threshold", async () => {
      const staff = buildStaff({ failedLoginAttempts: 4 });
      prisma.staff.findFirst.mockResolvedValue(staff);
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(service.login(staff.email, "wrong")).rejects.toThrow(UnauthorizedException);

      const call = prisma.staff.update.mock.calls[0][0];
      expect(call.data.failedLoginAttempts).toBe(5);
      expect(call.data.lockedUntil).toBeInstanceOf(Date);
    });

    it("resets failures and issues tokens on success", async () => {
      const staff = buildStaff({ failedLoginAttempts: 3 });
      prisma.staff.findFirst.mockResolvedValue(staff);
      mockedArgon2.verify.mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(staff.email, "correct");

      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: staff.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      expect(result.accessToken).toBe("signed-jwt");
      expect(result.mustChangePassword).toBe(false);
      expect(typeof result.refreshToken).toBe("string");
    });
  });

  describe("refresh", () => {
    it("rejects a token that isn't on file", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh("unknown")).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a revoked token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        staffId: "staff-1",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.refresh("revoked")).rejects.toThrow(UnauthorizedException);
    });

    it("rejects an expired token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        staffId: "staff-1",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh("expired")).rejects.toThrow(UnauthorizedException);
    });

    it("rotates the token and re-reads roles fresh from the database", async () => {
      const staff = buildStaff({ roles: [{ role: "SUPERADMIN" }] });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        staffId: staff.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.staff.findUniqueOrThrow.mockResolvedValue(staff);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.refresh("valid-token");

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: "rt-1" },
        data: { revokedAt: expect.any(Date) },
      });
      const signedPayload = jwt.signAsync.mock.calls[0][0];
      expect(signedPayload.roles).toEqual(["SUPERADMIN"]);
    });
  });

  describe("changePassword", () => {
    it("rejects an incorrect current password", async () => {
      prisma.staff.findUniqueOrThrow.mockResolvedValue(buildStaff());
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(service.changePassword("staff-1", "wrong", "newpassword1")).rejects.toThrow(UnauthorizedException);
    });

    it("updates the hash, clears mustChangePassword, and revokes other sessions", async () => {
      prisma.staff.findUniqueOrThrow.mockResolvedValue(buildStaff());
      mockedArgon2.verify.mockResolvedValue(true);
      mockedArgon2.hash.mockResolvedValue("new-hash" as never);

      await service.changePassword("staff-1", "correct", "newpassword1");

      expect(prisma.staff.update).toHaveBeenCalledWith({
        where: { id: "staff-1" },
        data: { passwordHash: "new-hash", mustChangePassword: false },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { staffId: "staff-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
