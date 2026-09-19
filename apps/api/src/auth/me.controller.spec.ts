import { MeController } from "@/auth/me.controller";

describe("MeController", () => {
  it("returns the caller's own profile, identified by the token", async () => {
    const staffAccounts = { getProfile: jest.fn().mockResolvedValue({ id: "staff-7" }) };
    const controller = new MeController(staffAccounts as never);

    await controller.profile({
      id: "staff-7",
      schoolId: "school-1",
      email: "n@s.test",
      roles: ["FORM_TEACHER"],
      mustChangePassword: false,
    } as never);

    expect(staffAccounts.getProfile).toHaveBeenCalledWith("school-1", "staff-7");
  });

  it("has no way to change the profile", () => {
    // Self-service edits would let anyone inside an account redirect that
    // person's salary. Only GET handlers may exist on this controller.
    const methods = Object.getOwnPropertyNames(MeController.prototype).filter((name) => name !== "constructor");
    expect(methods).toEqual(["profile"]);
  });
});
