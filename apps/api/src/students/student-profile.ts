type SiblingSource = {
  id: string;
  firstName: string;
  lastName: string;
  enrolments: { classArm: { name: string; classLevel: { name: string } } }[];
};

type GuardianLink<G> = { guardian: G & { students: { student: SiblingSource }[] } };

export type Sibling = { id: string; firstName: string; lastName: string; className: string | null };

/**
 * Shapes a student read for the profile page: each guardian's other children
 * become one deduplicated sibling list (a brother reached through both parents
 * appears once), and the nested copies are stripped from the guardians so the
 * response never carries them.
 *
 * `includeSiblings` is false for arm-scoped readers such as teachers, for
 * whom siblings would reveal children outside their classes.
 */
export function withSiblings<G extends object, L extends GuardianLink<G>, S extends { guardians: L[] }>(
  student: S,
  includeSiblings: boolean,
) {
  const siblings = new Map<string, Sibling>();

  const guardians = student.guardians.map((link) => {
    const { students, ...guardian } = link.guardian;
    if (includeSiblings) {
      for (const { student: sibling } of students) {
        const arm = sibling.enrolments[0]?.classArm;
        siblings.set(sibling.id, {
          id: sibling.id,
          firstName: sibling.firstName,
          lastName: sibling.lastName,
          className: arm ? `${arm.classLevel.name}${arm.name}` : null,
        });
      }
    }
    return { ...link, guardian };
  });

  return { ...student, guardians, siblings: [...siblings.values()] };
}
