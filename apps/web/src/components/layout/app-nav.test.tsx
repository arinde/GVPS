import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/layout/app-nav";
import { NAV_ITEMS, visibleNavItems } from "@/components/layout/nav-items";

describe("visibleNavItems", () => {
  it("shows role-free items to anyone signed in", () => {
    const labels = visibleNavItems(["FORM_TEACHER"]).map((item) => item.label);

    expect(labels).toContain("Overview");
    expect(labels).toContain("Students");
  });

  it("hides staff administration from anyone but a superadmin", () => {
    expect(visibleNavItems(["FORM_TEACHER"]).map((i) => i.label)).not.toContain("Add staff");
    expect(visibleNavItems(["SUPERADMIN"]).map((i) => i.label)).toContain("Add staff");
  });

  it("shows registration to the secretary, matching the API's guard", () => {
    expect(visibleNavItems(["ADMIN_SECRETARY"]).map((i) => i.label)).toContain("Register student");
  });

  it("hides registration from a subject teacher", () => {
    expect(visibleNavItems(["SUBJECT_TEACHER"]).map((i) => i.label)).not.toContain("Register student");
  });

  it("shows everything to a superadmin", () => {
    expect(visibleNavItems(["SUPERADMIN"])).toHaveLength(NAV_ITEMS.length);
  });
});

describe("AppNav", () => {
  function renderNav(overrides: Partial<React.ComponentProps<typeof AppNav>> = {}) {
    const props = {
      items: visibleNavItems(["SUPERADMIN"]),
      currentPath: "/",
      email: "superadmin@example.com",
      onSignOut: vi.fn(),
      ...overrides,
    };
    render(<AppNav {...props} />);
    return props;
  }

  it("marks the current page for assistive technology", () => {
    renderNav({ currentPath: "/students/new" });

    expect(screen.getByRole("link", { name: /register student/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /overview/i })).not.toHaveAttribute("aria-current");
  });

  it("does not mark Students as current when on the register page", () => {
    // /students/new starts with /students, so a naive prefix match would
    // light up both.
    renderNav({ currentPath: "/students/new" });

    expect(screen.getByRole("link", { name: /^students$/i })).not.toHaveAttribute("aria-current");
  });

  it("marks Overview current only on the root path", () => {
    renderNav({ currentPath: "/students" });

    expect(screen.getByRole("link", { name: /overview/i })).not.toHaveAttribute("aria-current");
  });

  it("shows the signed-in email and current period", () => {
    renderNav({ periodLabel: "2026/2027 · First Term" });

    expect(screen.getByText("superadmin@example.com")).toBeInTheDocument();
    expect(screen.getByText("2026/2027 · First Term")).toBeInTheDocument();
  });

  it("signs out on click", async () => {
    const { onSignOut } = renderNav();

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("disables the sign-out button while in flight", () => {
    renderNav({ isSigningOut: true });

    expect(screen.getByRole("button", { name: /signing out/i })).toBeDisabled();
  });
});
