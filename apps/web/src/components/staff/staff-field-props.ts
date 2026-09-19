import type { CreateStaffRequest } from "@/store/api/staff-api";

/** What every staff-form section receives. Presentational: props only. */
export type StaffFieldProps = {
  value: CreateStaffRequest;
  onChange: (patch: Partial<CreateStaffRequest>) => void;
  /** Keyed by the API's field path, e.g. "phone", "accountNumber". */
  errors: Record<string, string>;
  disabled?: boolean;
};
