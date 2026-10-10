import {
  ArrowUpRight,
  Building2,
  BookOpenText,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  CircleUserRound,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  NotebookPen,
  ScrollText,
  School,
  UserPlus,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Empty means every signed-in staff member sees it. */
  roles: string[];
  /** Undefined means the item stands alone, with no section header above it. */
  group?: string;
};

/**
 * Role lists mirror the guards on the API, so the menu shows what a person can
 * actually reach. Presentation only — RolesGuard and AccessScopeService reject
 * the request regardless of what the client renders (FEATURES.md §1.5).
 *
 * Grouped so the sidebar reads as a handful of sections (STITCH-GLOBAL.md §6's
 * own list is 7 items) rather than one long flat list. Order here is the
 * order both the sidebar and the mobile tab bar's "first four" use, so
 * Dashboard and the Students section — the two almost every role needs —
 * come first.
 *
 * Only screens that exist are listed. STITCH-GLOBAL.md §6 also names Requests;
 * that joins the menu when it is built, so the menu never leads somewhere empty.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [] },

  { href: "/students", label: "Students", icon: GraduationCap, roles: [], group: "Students" },
  {
    href: "/students/new",
    label: "Register student",
    icon: UserPlus,
    // A form teacher registers into their own allocated classes only.
    roles: ["SUPERADMIN", "ADMIN_SECRETARY", "PRINCIPAL", "FORM_TEACHER"],
    group: "Students",
  },
  // Admissions is office work (FEATURES.md §1.1) — a prospective student, so it sits with Students.
  {
    href: "/enquiries",
    label: "Enquiries",
    icon: Inbox,
    roles: ["SUPERADMIN", "PRINCIPAL", "ADMIN_SECRETARY"],
    group: "Students",
  },

  // Class and academic structure is configuration: superadmin and principal (FEATURES.md §14).
  { href: "/classes", label: "Classes", icon: School, roles: ["SUPERADMIN", "PRINCIPAL"], group: "Academics" },
  {
    href: "/academic",
    label: "Academic year",
    icon: CalendarDays,
    roles: ["SUPERADMIN", "PRINCIPAL"],
    group: "Academics",
  },
  { href: "/subjects", label: "Subjects", icon: BookOpenText, roles: ["SUPERADMIN", "PRINCIPAL"], group: "Academics" },
  {
    href: "/promotions",
    label: "Promotion",
    icon: ArrowUpRight,
    roles: ["SUPERADMIN", "PRINCIPAL"],
    group: "Academics",
  },
  // FEATURES.md §14 "Timetable" row: everyone except the bursar reads;
  // superadmin, principal and admin/secretary also write.
  {
    href: "/timetable",
    label: "Timetable",
    icon: CalendarClock,
    roles: ["SUPERADMIN", "PRINCIPAL", "ADMIN_SECRETARY", "FORM_TEACHER", "SUBJECT_TEACHER"],
    group: "Academics",
  },

  // Score entry (FEATURES.md §5.3): a subject teacher's own assignments only;
  // superadmin can open any, for corrections.
  {
    href: "/scores",
    label: "Score entry",
    icon: NotebookPen,
    roles: ["SUPERADMIN", "SUBJECT_TEACHER", "FORM_TEACHER"],
    group: "Results",
  },
  // Approval steps (FEATURES.md §5.4): each role sees the step it can take.
  {
    href: "/results/approval",
    label: "Results approval",
    icon: ClipboardCheck,
    roles: ["SUPERADMIN", "PRINCIPAL", "FORM_TEACHER", "SUBJECT_TEACHER"],
    group: "Results",
  },

  { href: "/staff", label: "Staff", icon: UsersRound, roles: ["SUPERADMIN"], group: "Staff" },
  { href: "/staff/classes", label: "Class allocation", icon: LayoutGrid, roles: ["SUPERADMIN"], group: "Staff" },

  // Debtor list (FEATURES.md §14): whole-school roles plus a form teacher's
  // own arm. Fee structure is reached from this page, not its own nav entry.
  {
    href: "/fees",
    label: "Fees",
    icon: Wallet,
    roles: ["SUPERADMIN", "PRINCIPAL", "BURSAR", "FORM_TEACHER"],
    group: "Finance",
  },

  // School details print on receipts; only the superadmin edits them (FEATURES.md §6.4).
  {
    href: "/settings/school",
    label: "School details",
    icon: Building2,
    roles: ["SUPERADMIN"],
    group: "Admin",
  },
  // The audit log is for the proprietor and principal only (FEATURES.md §11.5).
  { href: "/audit", label: "Email trail", icon: ScrollText, roles: ["SUPERADMIN", "PRINCIPAL"], group: "Admin" },

  // Every staff member can see their own record.
  { href: "/profile", label: "My profile", icon: CircleUserRound, roles: [] },
];

export function visibleNavItems(roles: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.length === 0 || item.roles.some((role) => roles.includes(role)));
}

export type NavGroup = { group: string | null; items: NavItem[] };

/**
 * Buckets an already role-filtered list into sections for the sidebar, in
 * the order they first appear — an item with no group stands alone, exactly
 * where it falls (so Dashboard and My profile never merge into one bucket
 * even though both are group-less).
 */
export function groupedNavItems(items: NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of items) {
    const key = item.group ?? null;
    const last = groups.at(-1);
    if (last && last.group === key) last.items.push(item);
    else groups.push({ group: key, items: [item] });
  }
  return groups;
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
