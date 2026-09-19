import type { AttentionItem } from "@/components/dashboard/attention-list";
import type { DashboardOverview } from "@/store/api/dashboard-api";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The "Waiting on you" rows, derived from the overview. Only problems the
 * superadmin can actually clear today are listed; each links to the screen
 * that clears it. Guardian requests and result approvals join when built.
 */
export function attentionItems(overview: DashboardOverview): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!overview.session) {
    items.push({
      id: "no-session",
      pill: { tone: "danger", shape: "square", text: "Blocked" },
      title: "No current session is set",
      detail: "Nobody can register students until a session is marked current.",
      action: { href: "/students", label: "Open registry" },
    });
  }

  const { withoutTeacher } = overview.classes;
  if (withoutTeacher > 0) {
    items.push({
      id: "classes-without-teacher",
      pill: { tone: "warning", shape: "diamond", text: plural(withoutTeacher, "class", "classes") },
      title: "Classes without a form teacher",
      detail: "Only the office can register into these until a teacher is allocated.",
      action: { href: "/staff/classes", label: "Allocate" },
    });
  }

  const fresh = overview.enquiries.new;
  if (fresh > 0) {
    items.push({
      id: "new-enquiries",
      pill: { tone: "warning", shape: "diamond", text: plural(fresh, "enquiry", "enquiries") },
      title: "New enquiries from the website",
      detail: "Parents waiting to hear from the school office.",
      action: { href: "/enquiries", label: "Review" },
    });
  }

  const { passwordNotSet } = overview.staff;
  if (passwordNotSet > 0) {
    items.push({
      id: "staff-password-not-set",
      pill: { tone: "info", shape: "hollow", text: plural(passwordNotSet, "account", "accounts") },
      title: "Staff yet to sign in",
      detail: "They still hold the temporary password from their slip.",
      action: { href: "/staff", label: "View staff" },
    });
  }

  return items;
}
