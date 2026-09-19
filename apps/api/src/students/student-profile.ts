import { EnrolmentStatus, type Prisma } from "@prisma/client";

/**
 * What the profile page reads for one student: the admitted level, whether a
 * photograph exists, guardians with their other children (for siblings), and
 * the enrolment history.
 */
export function profileInclude(studentId: string) {
  return {
    admittedIntoLevel: true,
    // Whether a photograph exists, and when it last changed; the image
    // itself is fetched separately so this record stays small.
    photo: { select: { updatedAt: true } },
    guardians: {
      orderBy: { isPrimary: "desc" },
      include: {
        guardian: {
          include: {
            students: {
              where: { studentId: { not: studentId } },
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    enrolments: {
                      where: { status: EnrolmentStatus.ACTIVE },
                      take: 1,
                      select: { classArm: { select: { name: true, classLevel: { select: { name: true } } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    enrolments: {
      orderBy: { session: { startDate: "desc" } },
      include: { classArm: { include: { classLevel: true } }, session: true },
    },
  } satisfies Prisma.StudentInclude;
}

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
