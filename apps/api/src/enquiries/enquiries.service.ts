import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { EnquiryStatus } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { auditDiff } from "@/common/audit-diff";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import type { SubmitEnquiryDto, UpdateEnquiryDto } from "@/enquiries/enquiries.schemas";
import { PrismaService } from "@/prisma/prisma.service";

// A public form is a target for spam. Per sender: at most this many per hour.
const LIMIT_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

/**
 * Admission enquiries: submitted by anyone from the landing page, read and
 * followed up by the office. The public side only ever creates; it can never
 * read what others sent.
 */
@Injectable()
export class EnquiriesService {
  // In memory: fine for one API instance; a second instance needs a shared store.
  private readonly recent = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submit(sender: string, dto: SubmitEnquiryDto) {
    this.throttle(sender);
    // The hidden field was filled: a bot. Answer as if it worked, store nothing.
    if (dto.website) return { received: true };

    // Single school today (PLAN.md §4.1).
    const school = await this.prisma.school.findFirstOrThrow({ select: { id: true } });
    await this.prisma.enquiry.create({
      data: {
        schoolId: school.id,
        parentName: dto.parentName,
        phone: dto.phone,
        email: dto.email,
        childName: dto.childName,
        interest: dto.interest,
        message: dto.message,
      },
    });
    return { received: true };
  }

  list(schoolId: string, status?: EnquiryStatus) {
    return this.prisma.enquiry.findMany({
      where: { schoolId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  countNew(schoolId: string) {
    return this.prisma.enquiry.count({ where: { schoolId, status: EnquiryStatus.NEW } });
  }

  async update(actor: AuthenticatedStaff, enquiryId: string, dto: UpdateEnquiryDto) {
    const existing = await this.prisma.enquiry.findFirst({ where: { id: enquiryId, schoolId: actor.schoolId } });
    if (!existing) throw new NotFoundException("Enquiry not found.");

    const changes = { status: dto.status, officeNote: dto.officeNote ?? null };
    const diff = auditDiff(existing, changes);
    if (!diff) return existing;

    const updated = await this.prisma.enquiry.update({
      where: { id: enquiryId },
      data: { ...changes, handledById: actor.id, handledAt: new Date() },
    });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "enquiry.updated",
      entityType: "Enquiry",
      entityId: enquiryId,
      before: diff.before,
      after: { ...diff.after, name: existing.parentName },
    });
    return updated;
  }

  private throttle(sender: string) {
    const now = Date.now();
    const times = (this.recent.get(sender) ?? []).filter((time) => now - time < HOUR_MS);
    if (times.length >= LIMIT_PER_HOUR) {
      throw new HttpException(
        "You have sent several enquiries already. Please call the school office instead.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    times.push(now);
    this.recent.set(sender, times);
  }
}
