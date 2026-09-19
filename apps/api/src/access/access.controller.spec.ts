import { Role } from "@prisma/client";
import { AccessController } from "@/access/access.controller";

describe("AccessController.me", () => {
  function setup(roles: Role[], allocatedArmIds: string[]) {
    const access = {
      studentScope: jest
        .fn()
        .mockResolvedValue(
          roles.includes(Role.FORM_TEACHER)
            ? { kind: "arms", sessionId: "s1", armIds: allocatedArmIds }
            : { kind: "school" },
        ),
      allocatedArms: jest.fn().mockResolvedValue({ sessionId: "s1", armIds: allocatedArmIds }),
    };
    const prisma = {
      school: { findUniqueOrThrow: jest.fn().mockResolvedValue({ name: "GVPS" }) },
      staff: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ firstName: "Ngozi", lastName: "Okafor", email: "n@s.test" }),
      },
      classArm: { findMany: jest.fn().mockResolvedValue(allocatedArmIds.map((id) => ({ id }))) },
    };
    const controller = new AccessController(access as never, prisma as never);
    const actor = { id: "staff-1", schoolId: "school-1", email: "n@s.test", roles, mustChangePassword: false };
    return { controller, actor, prisma };
  }

  it("tells a teacher they register only into their allocated classes", async () => {
    const { controller, actor } = setup([Role.FORM_TEACHER], ["p3a"]);

    const me = await controller.me(actor);

    expect(me).toMatchObject({ scope: "arms", canRegister: true, registersAnywhere: false });
    expect(me.allocatedArms).toEqual([{ id: "p3a" }]);
  });

  it("tells the secretary they register anywhere and see the whole school", async () => {
    const { controller, actor } = setup([Role.ADMIN_SECRETARY], []);

    await expect(controller.me(actor)).resolves.toMatchObject({
      scope: "school",
      canRegister: true,
      registersAnywhere: true,
    });
  });

  it("tells the bursar they cannot register", async () => {
    const { controller, actor } = setup([Role.BURSAR], []);

    await expect(controller.me(actor)).resolves.toMatchObject({ canRegister: false });
  });

  it("includes the school name and the signed-in person's name for the app shell", async () => {
    const { controller, actor } = setup([Role.SUPERADMIN], []);

    await expect(controller.me(actor)).resolves.toMatchObject({
      school: { name: "GVPS" },
      staff: { firstName: "Ngozi", lastName: "Okafor" },
    });
  });

  it("only looks up allocated arms inside the caller's school", async () => {
    const { controller, actor, prisma } = setup([Role.FORM_TEACHER], ["p3a"]);

    await controller.me(actor);

    expect(prisma.classArm.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["p3a"] }, schoolId: "school-1" } }),
    );
  });
});
