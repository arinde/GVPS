import type { AttentionItem } from "@/components/dashboard/attention-list";
import type { MyDashboard } from "@/store/api/dashboard-api";

/**
 * What a staff member can act on today, from their own dashboard. Only what
 * Phase 1 records: a missing class allocation, and students without a photo.
 * Score entry and attendance join when those modules exist.
 */
export function staffAttentionItems(dashboard: MyDashboard): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (dashboard.scope === "arms" && dashboard.classes.length === 0) {
    items.push({
      id: "no-class",
      pill: { tone: "warning", shape: "diamond", text: "No class" },
      title: "No class is allocated to you yet",
      detail: "Ask the superadmin to allocate your class. Until then you will not see any students.",
    });
  }

  const { withoutPhoto } = dashboard.students;
  if (withoutPhoto > 0 && dashboard.canRegister) {
    items.push({
      id: "missing-photos",
      pill: { tone: "info", shape: "hollow", text: `${withoutPhoto} student${withoutPhoto === 1 ? "" : "s"}` },
      title: "Passport photos missing",
      detail: "Open a student's profile and use Upload photo.",
      action: { href: "/students", label: "Open registry" },
    });
  }

  return items;
}
