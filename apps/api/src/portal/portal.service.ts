import { Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, type Prisma } from "@prisma/client";
import type { AuthenticatedParent } from "@/portal/parent-auth.primitives";
import { PrismaService } from "@/prisma/prisma.service";

const CURRENT_CLASS = {
  where: { status: EnrolmentStatus.ACTIVE },
  take: 1,
  select: {
    stream: true,
    session: { select: { name: true } },
    classArm: {
      select: {
        id: true,
        name: true,
        classLevel: { select: { name: true } },
      },
    },
  },
} satisfies Prisma.Student$enrolmentsArgs;

/**
 * What a parent sees. Every read is limited to their wards: students linked
 * to a guardian record carrying the signed-in phone number. Anything else
 * reads as not found, so ids cannot be probed. Read-only (FEATURES.md §12.1).
 */
@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  private wardsWhere(parent: AuthenticatedParent): Prisma.StudentWhereInput {
    return { schoolId: parent.schoolId, guardians: { some: { guardian: { phone: parent.phone } } } };
  }

  async me(parent: AuthenticatedParent) {
    const [school, guardians] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: parent.schoolId }, select: { name: true } }),
      this.prisma.guardian.findMany({
        where: { schoolId: parent.schoolId, phone: parent.phone },
        select: { firstName: true, lastName: true },
      }),
    ]);
    return { school, phone: parent.phone, names: guardians.map((g) => `${g.firstName} ${g.lastName}`) };
  }

  listChildren(parent: AuthenticatedParent) {
    return this.prisma.student.findMany({
      where: this.wardsWhere(parent),
      orderBy: [{ dateOfBirth: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        admissionNo: true,
        photo: { select: { updatedAt: true } },
        enrolments: CURRENT_CLASS,
      },
    });
  }

  async child(parent: AuthenticatedParent, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, ...this.wardsWhere(parent) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        admissionNo: true,
        admissionYear: true,
        dateOfBirth: true,
        sex: true,
        stateOfOrigin: true,
        lga: true,
        address: true,
        bloodGroup: true,
        medicalNote: true,
        admittedIntoLevel: { select: { name: true } },
        photo: { select: { updatedAt: true } },
        guardians: {
          orderBy: { isPrimary: "desc" },
          select: {
            relationship: true,
            isPrimary: true,
            guardian: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        enrolments: {
          orderBy: { session: { startDate: "desc" } },
          select: {
            id: true,
            status: true,
            stream: true,
            session: { select: { id: true, name: true } },
            classArm: { select: { id: true, name: true, classLevel: { select: { name: true } } } },
          },
        },
      },
    });
    if (!student) throw new NotFoundException("Child not found.");

    return { ...student, formTeacher: await this.formTeacher(student.enrolments) };
  }

  async photo(parent: AuthenticatedParent, studentId: string) {
    const ward = await this.prisma.student.findFirst({
      where: { id: studentId, ...this.wardsWhere(parent) },
      select: { photo: { select: { mimeType: true, data: true } } },
    });
    if (!ward?.photo) throw new NotFoundException("No photograph yet.");
    return { dataUrl: `data:${ward.photo.mimeType};base64,${Buffer.from(ward.photo.data).toString("base64")}` };
  }

  /** The current class's form teacher, by name only — a parent's first contact at school. */
  private async formTeacher(
    enrolments: { status: EnrolmentStatus; session: { id: string }; classArm: { id: string } }[],
  ) {
    const current = enrolments.find((enrolment) => enrolment.status === EnrolmentStatus.ACTIVE);
    if (!current) return null;
    const assignment = await this.prisma.classAssignment.findUnique({
      where: { sessionId_classArmId: { sessionId: current.session.id, classArmId: current.classArm.id } },
      select: { staff: { select: { firstName: true, lastName: true, otherNames: true } } },
    });
    return assignment?.staff ?? null;
  }
}
