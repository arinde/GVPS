import { GraduationCap, Home, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Empty means every signed-in staff member sees it. */
  roles: string[];
};

/**
 * Role lists mirror the guards on the API controllers, so the menu shows what
 * a person can actually reach. This is presentation only — RolesGuard rejects
 * the request regardless of what the client renders (FEATURES.md §1.5).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: Home, roles: [] },
  {
    href: "/students/new",
    label: "Register student",
    icon: UserPlus,
    roles: ["SUPERADMIN", "ADMIN_SECRETARY", "PRINCIPAL"],
  },
  { href: "/students", label: "Students", icon: Users, roles: [] },
  { href: "/staff/new", label: "Add staff", icon: GraduationCap, roles: ["SUPERADMIN"] },
];

export function visibleNavItems(roles: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.length === 0 || item.roles.some((role) => roles.includes(role)));
}
