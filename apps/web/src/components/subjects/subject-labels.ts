import type { Department, SubjectOffering } from "@/store/api/subjects-api";

export const DEPARTMENT_LABEL: Record<Department, string> = {
  SCIENCE: "Science",
  ARTS: "Arts",
  COMMERCIAL: "Commercial",
};

export const DEPARTMENT_OPTIONS = Object.entries(DEPARTMENT_LABEL).map(([value, label]) => ({ value, label }));

export const SECTION_LABEL = {
  NURSERY: "Early years",
  PRIMARY: "Primary",
  JUNIOR: "Junior secondary",
  SENIOR: "Senior secondary",
} as const;

/** "Primary 1, Primary 2, SSS 1 (Science)" — where a subject is offered, in class order. */
export function offeredSummary(offerings: SubjectOffering[]): string {
  if (offerings.length === 0) return "Not offered yet";
  return [...offerings]
    .sort((a, b) => a.classLevel.rank - b.classLevel.rank)
    .map((offering) =>
      offering.stream ? `${offering.classLevel.name} (${DEPARTMENT_LABEL[offering.stream]})` : offering.classLevel.name,
    )
    .join(", ");
}
