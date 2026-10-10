import { Injectable } from "@nestjs/common";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import { fromBasisPoints, toBasisPoints, type SchoolProfileDto } from "@/school/school-profile";

const PROFILE_SELECT = {
  name: true,
  address: true,
  phone: true,
  email: true,
  taxNumber: true,
  vatRateBps: true,
} as const;

/** The details printed on receipts (FEATURES.md §6.4) and the VAT rate applied to them. */
@Injectable()
export class SchoolProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(schoolId: string) {
    const school = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: PROFILE_SELECT });
    return toView(school);
  }

  async update(actor: AuthenticatedStaff, dto: SchoolProfileDto) {
    const before = await this.get(actor.schoolId);
    const after = await this.prisma.school.update({
      where: { id: actor.schoolId },
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        taxNumber: dto.taxNumber,
        vatRateBps: toBasisPoints(dto.vatRatePercent),
      },
      select: PROFILE_SELECT,
    });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "school.profile.updated",
      entityType: "School",
      entityId: actor.schoolId,
      before,
      after: toView(after),
    });
    return toView(after);
  }
}

function toView(school: {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  vatRateBps: number;
}) {
  return {
    name: school.name,
    address: school.address,
    phone: school.phone,
    email: school.email,
    taxNumber: school.taxNumber,
    vatRatePercent: fromBasisPoints(school.vatRateBps),
  };
}
