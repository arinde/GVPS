import { describe, expect, it } from "vitest";
import { validateChangePassword } from "@/lib/validate-change-password";

const valid = {
  currentPassword: "qLc1HdxJ7GKb",
  newPassword: "a-much-longer-one",
  confirmPassword: "a-much-longer-one",
};

describe("validateChangePassword", () => {
  it("passes a valid change", () => {
    expect(validateChangePassword(valid)).toEqual({});
  });

  it("flags a new password under 10 characters", () => {
    expect(validateChangePassword({ ...valid, newPassword: "short", confirmPassword: "short" }).newPassword).toMatch(
      /at least 10/,
    );
  });

  it("flags a confirmation that does not match", () => {
    expect(validateChangePassword({ ...valid, confirmPassword: "a-much-longer-onx" }).confirmPassword).toMatch(
      /doesn't match/i,
    );
  });

  it("flags a missing current password", () => {
    expect(validateChangePassword({ ...valid, currentPassword: "" }).currentPassword).toBeDefined();
  });

  it("refuses to reuse the current password", () => {
    const same = "same-password-123";
    expect(
      validateChangePassword({ currentPassword: same, newPassword: same, confirmPassword: same }).newPassword,
    ).toMatch(/different/);
  });
});
