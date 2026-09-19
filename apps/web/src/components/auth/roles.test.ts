import { describe, expect, it } from "vitest";
import { primaryRoleLabel } from "@/components/auth/roles";

describe("primaryRoleLabel", () => {
  it("names the most senior role someone holds", () => {
    expect(primaryRoleLabel(["FORM_TEACHER", "SUPERADMIN"])).toBe("Superadmin");
  });

  it("names a single role", () => {
    expect(primaryRoleLabel(["BURSAR"])).toBe("Bursar");
  });

  it("falls back to a neutral label", () => {
    expect(primaryRoleLabel([])).toBe("Staff");
  });
});
