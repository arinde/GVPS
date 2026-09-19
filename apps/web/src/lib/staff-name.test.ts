import { describe, expect, it } from "vitest";
import { staffName } from "@/lib/staff-name";

describe("staffName", () => {
  it("puts the surname first, as the office registers do", () => {
    expect(staffName({ firstName: "Ngozi", lastName: "Okafor", email: "n@s.test" })).toBe("Okafor, Ngozi");
  });

  it("falls back to the email for an account with no details", () => {
    expect(staffName({ firstName: null, lastName: null, email: "superadmin@example.com" })).toBe(
      "superadmin@example.com",
    );
  });

  it("uses whichever name exists when only one does", () => {
    expect(staffName({ firstName: null, lastName: "Okafor", email: "n@s.test" })).toBe("Okafor");
  });
});
