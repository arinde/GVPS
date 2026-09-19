import { GraduationCap, LayoutDashboard, UserPlus, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Empty means every signed-in staff member sees it. */
  roles: string[];
};

/**
 * Role lists mirror the guards on the API, so the menu shows what a person can
 * actually reach. Presentation only — RolesGuard and AccessScopeService reject
 * the request regardless of what the client renders (FEATURES.md §1.5).
 *
 * Only screens that exist are listed. STITCH-GLOBAL.md §6 names Fees, Results,
 * Requests and Settings too; those join the menu when they are built, so the
 * menu never leads somewhere empty.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: [] },
  { href: "/students", label: "Students", icon: GraduationCap, roles: [] },
  {
    href: "/students/new",
    label: "Register student",
    icon: UserPlus,
    // A form teacher registers into their own allocated classes only.
    roles: ["SUPERADMIN", "ADMIN_SECRETARY", "PRINCIPAL", "FORM_TEACHER"],
  },
  { href: "/staff/new", label: "Add staff", icon: UsersRound, roles: ["SUPERADMIN"] },
];

export function visibleNavItems(roles: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.length === 0 || item.roles.some((role) => roles.includes(role)));
}

/**
 * The item to mark current: the longest href the path falls under, not merely
 * the first. "/students/new" is under "/students" too, so without this both
 * would light up.
 */
export function activeNavItem(items: NavItem[], currentPath: string): NavItem | null {
  const matches = items.filter((item) =>
    item.href === "/" ? currentPath === "/" : currentPath === item.href || currentPath.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((longest, item) => (item.href.length > longest.href.length ? item : longest));
}
