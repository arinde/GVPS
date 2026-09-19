import { describe, expect, it } from "vitest";
import { activeNavItem, NAV_ITEMS, visibleNavItems } from "@/components/layout/nav-items";

const labels = (roles: string[]) => visibleNavItems(roles).map((item) => item.label);

describe("visibleNavItems", () => {
  it("shows role-free items to anyone signed in", () => {
    expect(labels(["BURSAR"])).toEqual(expect.arrayContaining(["Dashboard", "Students"]));
  });

  it("hides staff administration from anyone but a superadmin", () => {
    expect(labels(["FORM_TEACHER"])).not.toContain("Staff");
    expect(labels(["SUPERADMIN"])).toContain("Staff");
  });

  it("shows registration to a form teacher, who registers into their own class", () => {
    expect(labels(["FORM_TEACHER"])).toContain("Register student");
  });

  it("hides registration from the bursar and a subject teacher", () => {
    expect(labels(["BURSAR"])).not.toContain("Register student");
    expect(labels(["SUBJECT_TEACHER"])).not.toContain("Register student");
  });

  it("shows everything to a superadmin", () => {
    expect(visibleNavItems(["SUPERADMIN"])).toHaveLength(NAV_ITEMS.length);
  });
});

describe("activeNavItem", () => {
  it("picks the most specific match, so /students/new is not also Students", () => {
    expect(activeNavItem(NAV_ITEMS, "/students/new")?.label).toBe("Register student");
  });

  it("matches a section's own page", () => {
    expect(activeNavItem(NAV_ITEMS, "/students")?.label).toBe("Students");
  });

  it("treats the dashboard as current only on the root path", () => {
    expect(activeNavItem(NAV_ITEMS, "/dashboard")?.label).toBe("Dashboard");
    expect(activeNavItem(NAV_ITEMS, "/students")?.label).not.toBe("Dashboard");
  });

  it("does not match a path that merely shares a prefix", () => {
    expect(activeNavItem(NAV_ITEMS, "/studentsx")).toBeNull();
  });
});
