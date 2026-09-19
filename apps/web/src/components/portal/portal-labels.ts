type Enrolment = { status?: string; classArm: { name: string; classLevel: { name: string } } };

export const DEPARTMENT = { SCIENCE: "Science", ARTS: "Arts", COMMERCIAL: "Commercial" } as const;
export const RELATIONSHIP = { FATHER: "Father", MOTHER: "Mother", GUARDIAN: "Guardian" } as const;

/** "JSS 1A", or a plain sentence when the child has no current class. */
export function currentClassLabel(enrolments: Enrolment[]): string {
  const current = enrolments.find((enrolment) => !enrolment.status || enrolment.status === "ACTIVE");
  return current ? `${current.classArm.classLevel.name}${current.classArm.name}` : "Not in a class this session";
}

/** "ACTIVE" -> "Active". */
export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
