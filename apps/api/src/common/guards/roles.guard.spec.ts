import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { RolesGuard } from "@/common/guards/roles.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

function buildContext(user: AuthenticatedStaff): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function buildUser(roles: AuthenticatedStaff["roles"]): AuthenticatedStaff {
  return { id: "staff-1", schoolId: "school-1", email: "a@example.com", roles, mustChangePassword: false };
}

describe("RolesGuard", () => {
  function buildGuard(requiredRoles: AuthenticatedStaff["roles"] | undefined) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(requiredRoles) } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it("allows any authenticated staff when no roles are required", () => {
    const guard = buildGuard(undefined);
    expect(guard.canActivate(buildContext(buildUser([])))).toBe(true);
  });

  // TESTS.md §6.4: secretary creating/changing a staff account is denied.
  it("denies ADMIN_SECRETARY on a SUPERADMIN-only route", () => {
    const guard = buildGuard(["SUPERADMIN"]);
    expect(guard.canActivate(buildContext(buildUser(["ADMIN_SECRETARY"])))).toBe(false);
  });

  // TESTS.md §6.4: superadmin performing the same action is allowed.
  it("allows SUPERADMIN on a SUPERADMIN-only route", () => {
    const guard = buildGuard(["SUPERADMIN"]);
    expect(guard.canActivate(buildContext(buildUser(["SUPERADMIN"])))).toBe(true);
  });

  it("allows a staff member holding any one of several required roles", () => {
    const guard = buildGuard(["PRINCIPAL", "SUPERADMIN"]);
    expect(guard.canActivate(buildContext(buildUser(["FORM_TEACHER", "PRINCIPAL"])))).toBe(true);
  });

  it("denies a staff member holding none of the required roles", () => {
    const guard = buildGuard(["BURSAR"]);
    expect(guard.canActivate(buildContext(buildUser(["FORM_TEACHER", "SUBJECT_TEACHER"])))).toBe(false);
  });
});
