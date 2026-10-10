import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, ResultSheetStatus, Role } from "@prisma/client";
import { AccessScopeService } from "@/access/access-scope.service";
import { buildBroadsheet } from "@/assessment/broadsheet";
import { isSnapshot, type ResultSnapshot } from "@/assessment/result-snapshot";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

// FEATURES.md §14 "Report cards" row governs the broadsheet too — it's the
// same data, laid out across the whole class instead of one student at a
// time. Subject teachers and parents have no access to it.
const WHOLE_SCHOOL: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY];

@Injectable()
export class BroadsheetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessScopeService,
  ) {}

  async forArm(actor: AuthenticatedStaff, termId: string, classArmId: string) {
    if (!actor.roles.some((role) => WHOLE_SCHOOL.includes(role))) {
      if (!actor.roles.includes(Role.FORM_TEACHER))
        throw new ForbiddenException("You do not have access to the broadsheet.");
      const { armIds } = await this.access.allocatedArms(actor);
      if (!armIds.includes(classArmId)) throw new ForbiddenException("This is not one of your classes.");
    }

    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");
    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const [sheets, enrolments] = await Promise.all([
      this.prisma.resultSheet.findMany({
        where: { schoolId: actor.schoolId, termId, classArmId, status: ResultSheetStatus.PUBLISHED },
        select: { subjectId: true, frozen: true },
      }),
      this.prisma.enrolment.findMany({
        where: { schoolId: actor.schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
        orderBy: { student: { lastName: "asc" } },
      }),
    ]);

    const subjectRecords = await this.prisma.subject.findMany({
      where: { id: { in: [...new Set(sheets.map((sheet) => sheet.subjectId))] } },
      select: { id: true, name: true },
    });
    const subjectName = new Map(subjectRecords.map((subject) => [subject.id, subject.name]));

    const subjects = sheets.flatMap((sheet) => {
      const snapshot = sheet.frozen;
      if (!isSnapshot(snapshot)) return [];
      return [
        {
          subjectId: sheet.subjectId,
          subjectName: subjectName.get(sheet.subjectId) ?? "—",
          snapshot: snapshot as ResultSnapshot,
        },
      ];
    });

    const students = enrolments.map((enrolment) => ({
      studentId: enrolment.student.id,
      name: `${enrolment.student.lastName}, ${enrolment.student.firstName}`,
      admissionNo: enrolment.student.admissionNo,
    }));

    return buildBroadsheet({
      term: { name: term.name, sequence: term.sequence },
      classLabel: `${classArm.classLevel.name}${classArm.name}`,
      students,
      subjects,
    });
  }
}
