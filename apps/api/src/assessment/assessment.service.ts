import { Injectable, NotFoundException } from "@nestjs/common";
import type { AssessmentComponent, GradeBand, GradingScale, Section } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { PrismaService } from "@/prisma/prisma.service";
import type { SetAssessmentComponentsDto, SetGradingScaleDto } from "@/assessment/schemas/assessment.schema";

type GradingScaleWithBands = GradingScale & { bands: GradeBand[] };

/**
 * Assessment configuration (FEATURES.md §5.1, §5.2) — Block 1 of the results
 * engine (WIP.md). Components and grading scales are read by score entry and
 * computation once those exist; nothing here computes a result itself.
 */
@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Replaces the whole component set for one (term, section) atomically.
   * A term's components are never edited in place once scores might exist
   * against them — see the schema comment on AssessmentComponent.
   */
  async setComponents(
    actorStaffId: string,
    schoolId: string,
    termId: string,
    dto: SetAssessmentComponentsDto,
  ): Promise<AssessmentComponent[]> {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId } });
    if (!term) throw new NotFoundException("Term not found.");

    const components = await this.prisma.$transaction(async (tx) => {
      await tx.assessmentComponent.deleteMany({ where: { termId, section: dto.section } });
      await tx.assessmentComponent.createMany({
        data: dto.components.map((component) => ({
          schoolId,
          termId,
          section: dto.section,
          name: component.name,
          maxScore: component.maxScore,
        })),
      });
      return tx.assessmentComponent.findMany({
        where: { termId, section: dto.section },
        orderBy: { createdAt: "asc" },
      });
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "assessment.components.set",
      entityType: "Term",
      entityId: termId,
      after: { section: dto.section, components: dto.components },
    });

    return components;
  }

  listComponents(schoolId: string, termId: string, section: Section): Promise<AssessmentComponent[]> {
    return this.prisma.assessmentComponent.findMany({
      where: { schoolId, termId, section },
      orderBy: { createdAt: "asc" },
    });
  }

  async setGradingScale(
    actorStaffId: string,
    schoolId: string,
    dto: SetGradingScaleDto,
  ): Promise<GradingScaleWithBands> {
    const existing = await this.prisma.gradingScale.findUnique({
      where: { schoolId_section: { schoolId, section: dto.section } },
    });

    const scale = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.gradingScale.upsert({
        where: { schoolId_section: { schoolId, section: dto.section } },
        create: {
          schoolId,
          section: dto.section,
          passMark: dto.passMark,
          promotionThreshold: dto.promotionThreshold,
        },
        update: { passMark: dto.passMark, promotionThreshold: dto.promotionThreshold },
      });

      await tx.gradeBand.deleteMany({ where: { gradingScaleId: saved.id } });
      await tx.gradeBand.createMany({
        data: dto.bands.map((band) => ({ gradingScaleId: saved.id, ...band })),
      });

      return tx.gradingScale.findUniqueOrThrow({
        where: { id: saved.id },
        include: { bands: { orderBy: { minScore: "asc" } } },
      });
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "assessment.grading_scale.set",
      entityType: "GradingScale",
      entityId: scale.id,
      before: existing ? { passMark: existing.passMark, promotionThreshold: existing.promotionThreshold } : undefined,
      after: {
        section: dto.section,
        passMark: dto.passMark,
        promotionThreshold: dto.promotionThreshold,
        bands: dto.bands,
      },
    });

    return scale;
  }

  getGradingScale(schoolId: string, section: Section): Promise<GradingScaleWithBands | null> {
    return this.prisma.gradingScale.findUnique({
      where: { schoolId_section: { schoolId, section } },
      include: { bands: { orderBy: { minScore: "asc" } } },
    });
  }
}
