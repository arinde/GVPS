import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { FeeItem, FeeStructureItem } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { SetFeeStructureItemDto } from "@/fees/schemas/fees.schemas";

/**
 * FEATURES.md §6.1 — the fee catalogue and what each class level owes per
 * term. Fully data-driven, like assessment components: nothing here is
 * hardcoded, and every school names and prices these differently.
 */
@Injectable()
export class FeeStructureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listFeeItems(schoolId: string): Promise<FeeItem[]> {
    return this.prisma.feeItem.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
  }

  async createFeeItem(actor: AuthenticatedStaff, name: string): Promise<FeeItem> {
    const existing = await this.prisma.feeItem.findUnique({
      where: { schoolId_name: { schoolId: actor.schoolId, name } },
    });
    if (existing) throw new ConflictException(`A fee item named "${name}" already exists.`);

    const item = await this.prisma.feeItem.create({ data: { schoolId: actor.schoolId, name } });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "fees.item.created",
      entityType: "FeeItem",
      entityId: item.id,
      after: { name },
    });
    return item;
  }

  listStructure(schoolId: string, termId: string): Promise<FeeStructureItem[]> {
    return this.prisma.feeStructureItem.findMany({
      where: { schoolId, termId },
      orderBy: [{ classLevelId: "asc" }],
    });
  }

  /** Upserts one (term, class level, fee item) row — the whole structure is built one of these at a time. */
  async setStructureItem(
    actor: AuthenticatedStaff,
    termId: string,
    dto: SetFeeStructureItemDto,
  ): Promise<FeeStructureItem> {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");

    const classLevel = await this.prisma.classLevel.findFirst({
      where: { id: dto.classLevelId, schoolId: actor.schoolId },
    });
    if (!classLevel) throw new NotFoundException("Class level not found.");

    const feeItem = await this.prisma.feeItem.findFirst({ where: { id: dto.feeItemId, schoolId: actor.schoolId } });
    if (!feeItem) throw new NotFoundException("Fee item not found.");

    const existing = await this.prisma.feeStructureItem.findUnique({
      where: { termId_classLevelId_feeItemId: { termId, classLevelId: dto.classLevelId, feeItemId: dto.feeItemId } },
    });

    const saved = await this.prisma.feeStructureItem.upsert({
      where: { termId_classLevelId_feeItemId: { termId, classLevelId: dto.classLevelId, feeItemId: dto.feeItemId } },
      create: {
        schoolId: actor.schoolId,
        termId,
        classLevelId: dto.classLevelId,
        feeItemId: dto.feeItemId,
        amountKobo: dto.amountKobo,
        isCompulsory: dto.isCompulsory,
      },
      update: { amountKobo: dto.amountKobo, isCompulsory: dto.isCompulsory },
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "fees.structure.set",
      entityType: "FeeStructureItem",
      entityId: saved.id,
      before: existing ? { amountKobo: existing.amountKobo, isCompulsory: existing.isCompulsory } : undefined,
      after: { classLevel: classLevel.name, feeItem: feeItem.name, ...dto },
    });

    return saved;
  }

  /**
   * FEATURES.md §6.1: "a new session copies forward the previous structure
   * as a starting point." Copies every row from the given term into the
   * target term; rows that already exist there are left untouched.
   */
  async copyStructure(actor: AuthenticatedStaff, fromTermId: string, toTermId: string): Promise<number> {
    const [source, target] = await Promise.all([
      this.prisma.term.findFirst({ where: { id: fromTermId, schoolId: actor.schoolId } }),
      this.prisma.term.findFirst({ where: { id: toTermId, schoolId: actor.schoolId } }),
    ]);
    if (!source || !target) throw new NotFoundException("Term not found.");

    const rows = await this.prisma.feeStructureItem.findMany({ where: { termId: fromTermId } });
    // skipDuplicates rather than upsert: a row already set for the target
    // term (someone adjusted it ahead of the copy) is left exactly as is.
    const { count: copied } = await this.prisma.feeStructureItem.createMany({
      data: rows.map((row) => ({
        schoolId: actor.schoolId,
        termId: toTermId,
        classLevelId: row.classLevelId,
        feeItemId: row.feeItemId,
        amountKobo: row.amountKobo,
        isCompulsory: row.isCompulsory,
      })),
      skipDuplicates: true,
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "fees.structure.copied",
      entityType: "Term",
      entityId: toTermId,
      after: { fromTerm: source.name, toTerm: target.name, rows: copied },
    });

    return copied;
  }
}
