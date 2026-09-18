import type { RegisterStudentRequest } from "@/store/api/students-api";

/** What every student-fields section receives. Presentational: props only. */
export type StudentFieldProps = {
  value: RegisterStudentRequest;
  onChange: (patch: Partial<RegisterStudentRequest>) => void;
  /** Keyed by the API's field path, e.g. "dateOfBirth", "stream". */
  errors: Record<string, string>;
  disabled?: boolean;
};
