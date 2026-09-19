import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar, crestInitials } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { MobileTabBar, MobileTopBar } from "@/components/layout/mobile-nav";
import { NAV_ITEMS } from "@/components/layout/nav-items";

describe("crestInitials", () => {
  it.each([
    ["GVPS", "GVPS"],
    ["Greenvale Primary School", "GPS"],
    ["Our Lady of Fatima College", "OLO"],
  ])("%s -> %s", (name, initials) => {
    expect(crestInitials(name)).toBe(initials);
  });
});

describe("AppSidebar", () => {
  it("shows the school's name", () => {
    render(<AppSidebar items={NAV_ITEMS} activeHref="/dashboard" schoolName="GVPS" />);

    expect(screen.getByText("GVPS", { selector: "p" })).toBeInTheDocument();
  });

  it("marks only the active item as the current page", () => {
    render(<AppSidebar items={NAV_ITEMS} activeHref="/students" schoolName="GVPS" />);

    expect(screen.getByRole("link", { name: "Students" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});

describe("AppTopBar", () => {
  it("shows the period and who is signed in", () => {
    render(<AppTopBar context="2026/2027 · First Term" signedInAs="Okafor, Ngozi · Superadmin" onSignOut={vi.fn()} />);

    expect(screen.getByText("2026/2027 · First Term")).toBeInTheDocument();
    expect(screen.getByText("Okafor, Ngozi · Superadmin")).toBeInTheDocument();
  });

  it("logs out", async () => {
    const onSignOut = vi.fn();
    render(<AppTopBar context="" signedInAs="" onSignOut={onSignOut} />);

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("disables log out while it is in progress", () => {
    render(<AppTopBar context="" signedInAs="" onSignOut={vi.fn()} isSigningOut />);

    expect(screen.getByRole("button", { name: /logging out/i })).toBeDisabled();
  });
});

describe("mobile navigation", () => {
  it("shows the screen title and logs out from the top bar", async () => {
    const onSignOut = vi.fn();
    render(<MobileTopBar title="Students" onSignOut={onSignOut} />);

    expect(screen.getByText("Students")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("marks the active tab", () => {
    render(<MobileTabBar items={NAV_ITEMS.slice(0, 4)} activeHref="/students/new" />);

    expect(screen.getByRole("link", { name: /register student/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /^students$/i })).not.toHaveAttribute("aria-current");
  });
});
