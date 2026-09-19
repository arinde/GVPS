/**
 * Turns an audit row into the two lines the dashboard's "Recent activity"
 * shows (STITCH-SCREENS.md screen 1). Only fields the audit already records
 * are read, and an unknown action falls back to a generic line rather than
 * being hidden — the feed must never under-report what happened.
 */
export type ActivityRow = { action: string; after: unknown };
export type ActivityText = { title: string; detail: string };

function field(after: unknown, key: string): string | null {
  if (typeof after !== "object" || after === null) return null;
  const value = (after as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

// Identifying fields added to an audit "after" for display, not changes.
const LABEL_FIELDS = new Set(["name", "admissionNo"]);

/** "phone, address" — which fields an edit changed, from its audit "after". */
function changedList(after: unknown): string | null {
  if (typeof after !== "object" || after === null) return null;
  const keys = Object.keys(after).filter((key) => !LABEL_FIELDS.has(key));
  return keys.length ? `changed ${keys.join(", ")}` : null;
}

const joined = (...parts: (string | null)[]) => parts.filter(Boolean).join(" · ");

export function describeActivity({ action, after }: ActivityRow): ActivityText {
  switch (action) {
    case "student.registered":
      return {
        title: "Student registered",
        detail: joined(field(after, "name"), field(after, "arm"), field(after, "admissionNo")),
      };
    case "student.updated":
      return { title: "Student record corrected", detail: joined(field(after, "admissionNo"), changedList(after)) };
    case "guardian.updated":
      return { title: "Guardian details corrected", detail: joined(field(after, "name"), changedList(after)) };
    case "staff.updated":
      return { title: "Staff record corrected", detail: joined(field(after, "name"), changedList(after)) };
    case "student.photo.set":
      return { title: "Photograph added", detail: field(after, "admissionNo") ?? "" };
    case "staff.create":
      return { title: "Staff account created", detail: joined(field(after, "name"), field(after, "email")) };
    case "class.teacher.set":
      return { title: "Form teacher allocated", detail: joined(field(after, "class"), field(after, "session")) };
    case "class.teacher.cleared":
      return { title: "Form teacher removed", detail: joined(field(after, "class"), field(after, "session")) };
    case "academic.arm.created":
      return { title: "Class added", detail: joined(field(after, "level"), field(after, "name")) };
    case "academic.arm.updated":
      return { title: "Class size changed", detail: field(after, "class") ?? "" };
    case "staff.role.grant":
      return { title: "Role granted", detail: field(after, "role") ?? "" };
    case "staff.role.revoke":
      return { title: "Role removed", detail: "" };
    case "staff.password.reset":
      return { title: "Password reset", detail: "Temporary password issued" };
    default:
      return { title: "Record changed", detail: action };
  }
}
