import { Role } from "@prisma/client";
import { mayRegisterAnywhere, mayRegisterAtAll, mayRegisterInto, scopeFor } from "@/access/access-scope";
import { AccessScopeService } from "@/access/access-scope.service";

describe("scopeFor", () => {
  it.each([Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR, Role.ADMIN_SECRETARY])("gives %s the whole school", (role) => {
    expect(scopeFor([role], "session-1", [])).toEqual({ kind: "school" });
  });

  it.each([Role.FORM_TEACHER, Role.SUBJECT_TEACHER])("limits %s to allocated classes", (role) => {
    expect(scopeFor([role], "session-1", ["arm-1", "arm-2"])).toEqual({
      kind: "arms",
      sessionId: "session-1",
      armIds: ["arm-1", "arm-2"],
    });
  });

  it("gives a teacher with no allocation an empty scope, not the whole school", () => {
    expect(scopeFor([Role.FORM_TEACHER], "session-1", [])).toEqual({
      kind: "arms",
      sessionId: "session-1",
      armIds: [],
    });
  });

  it("lets the widest role win for someone holding two", () => {
    expect(scopeFor([Role.FORM_TEACHER, Role.ADMIN_SECRETARY], "session-1", ["arm-1"])).toEqual({ kind: "school" });
  });
});

describe("mayRegisterInto", () => {
  it.each([Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY])("lets %s register into any class", (role) => {
    expect(mayRegisterInto([role], [], "arm-9")).toBe(true);
  });

  it("lets a form teacher register into an allocated class", () => {
    expect(mayRegisterInto([Role.FORM_TEACHER], ["arm-1"], "arm-1")).toBe(true);
  });

  it("refuses a form teacher registering into another class", () => {
    expect(mayRegisterInto([Role.FORM_TEACHER], ["arm-1"], "arm-2")).toBe(false);
  });

  it("refuses the bursar, who reads the registry but does not write it", () => {
    expect(mayRegisterInto([Role.BURSAR], [], "arm-1")).toBe(false);
  });

  it("refuses a subject teacher, even in a class they teach", () => {
    expect(mayRegisterInto([Role.SUBJECT_TEACHER], ["arm-1"], "arm-1")).toBe(false);
  });
});

describe("mayRegisterAnywhere / mayRegisterAtAll", () => {
  it("separates registering anywhere from registering at all", () => {
    expect(mayRegisterAnywhere([Role.FORM_TEACHER])).toBe(false);
    expect(mayRegisterAtAll([Role.FORM_TEACHER])).toBe(true);
    expect(mayRegisterAtAll([Role.BURSAR])).toBe(false);
  });
});

describe("AccessScopeService.studentWhere", () => {
  it("adds no filter for the whole school", () => {
    expect(AccessScopeService.studentWhere({ kind: "school" })).toEqual({});
  });

  it("matches nothing when there is no current session, rather than everything", () => {
    const where = AccessScopeService.studentWhere({ kind: "arms", sessionId: null, armIds: ["arm-1"] });

    expect(where).toEqual({
      enrolments: { some: { classArmId: { in: ["arm-1"] }, sessionId: "__no_current_session__", status: "ACTIVE" } },
    });
  });
});

describe("AccessScopeService.allocatedArms", () => {
  it("reads this session's allocations for the signed-in staff member only", async () => {
    const prisma = {
      academicSession: { findFirst: jest.fn().mockResolvedValue({ id: "session-1" }) },
      classAssignment: { findMany: jest.fn().mockResolvedValue([{ classArmId: "arm-1" }]) },
    };
    const service = new AccessScopeService(prisma as never);

    const result = await service.allocatedArms({
      id: "teacher-1",
      schoolId: "school-1",
      email: "t@school.test",
      roles: [Role.FORM_TEACHER],
      mustChangePassword: false,
    });

    expect(result).toEqual({ sessionId: "session-1", armIds: ["arm-1"] });
    expect(prisma.classAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: "school-1", sessionId: "session-1", staffId: "teacher-1" } }),
    );
  });

  it("returns nothing when no session is current", async () => {
    const prisma = {
      academicSession: { findFirst: jest.fn().mockResolvedValue(null) },
      classAssignment: { findMany: jest.fn() },
    };
    const service = new AccessScopeService(prisma as never);

    const result = await service.allocatedArms({
      id: "t",
      schoolId: "s",
      email: "t@s.test",
      roles: [Role.FORM_TEACHER],
      mustChangePassword: false,
    });

    expect(result).toEqual({ sessionId: null, armIds: [] });
    expect(prisma.classAssignment.findMany).not.toHaveBeenCalled();
  });
});
