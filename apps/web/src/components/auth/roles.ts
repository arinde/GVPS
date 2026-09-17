/** Mirrors the backend's Role enum (apps/api/prisma/schema.prisma) — kept as a plain list since the two apps don't share types. */
export const ROLE_OPTIONS = [
  { value: "SUPERADMIN", label: "Superadmin" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "BURSAR", label: "Bursar" },
  { value: "FORM_TEACHER", label: "Form teacher" },
  { value: "SUBJECT_TEACHER", label: "Subject teacher" },
  { value: "ADMIN_SECRETARY", label: "Admin / secretary" },
] as const;
