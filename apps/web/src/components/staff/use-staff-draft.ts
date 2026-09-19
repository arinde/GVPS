import { useState } from "react";
import { withoutFieldErrors } from "@/lib/api-error";
import type { CreateStaffRequest, StaffRole } from "@/store/api/staff-api";

export const EMPTY_STAFF: CreateStaffRequest = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  nextOfKinName: "",
  nextOfKinRelationship: "",
  nextOfKinPhone: "",
  roles: [],
};

/** Drops empty optional values so the API's optional fields stay absent. */
export function cleanedStaff(draft: CreateStaffRequest): CreateStaffRequest {
  return Object.fromEntries(
    Object.entries(draft).filter(([, value]) => value !== "" && value !== undefined),
  ) as CreateStaffRequest;
}

/**
 * A staff form's draft and field errors, shared by creating and editing. The
 * draft is the person's unsaved edits — local state with no other source,
 * which is what useState is for (AGENTS.md §2). When editing, `initial` is
 * the saved record, read once; the caller keys the form on the record's id.
 */
export function useStaffDraft(initial: CreateStaffRequest = EMPTY_STAFF) {
  const [draft, setDraft] = useState<CreateStaffRequest>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function patch(changes: Partial<CreateStaffRequest>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setFieldErrors((errors) => withoutFieldErrors(errors, Object.keys(changes)));
  }

  function toggleRole(role: StaffRole, checked: boolean) {
    setDraft((previous) => ({
      ...previous,
      roles: checked ? [...previous.roles, role] : previous.roles.filter((selected) => selected !== role),
    }));
    setFieldErrors((errors) => withoutFieldErrors(errors, ["roles"]));
  }

  return { draft, setDraft, fieldErrors, setFieldErrors, patch, toggleRole };
}
