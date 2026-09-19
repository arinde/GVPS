import type { RegisterStudentRequest } from "@/store/api/students-api";

/** A student's own details: what both registering and correcting a record edit. */
export type StudentDetails = Pick<
  RegisterStudentRequest,
  | "firstName"
  | "lastName"
  | "otherNames"
  | "dateOfBirth"
  | "sex"
  | "stateOfOrigin"
  | "lga"
  | "address"
  | "bloodGroup"
  | "medicalNote"
>;

/**
 * What every student-fields section receives. Presentational: props only.
 * Sections that edit only a student's own details take the default; the class
 * section takes the full registration request.
 */
export type StudentFieldProps<T = StudentDetails> = {
  value: T;
  onChange: (patch: Partial<T>) => void;
  /** Keyed by the API's field path, e.g. "dateOfBirth", "stream". */
  errors: Record<string, string>;
  disabled?: boolean;
};
