import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export type AuditEntry = {
  schoolId: string;
  actorStaffId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
};

/**
 * Append-only (PLAN.md §4.10) — no update/delete methods on purpose. Only
 * `record` is implemented for now; the viewer half of the audit/ module
 * (Nest module layout) lands with whatever screen first needs to read it.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        schoolId: entry.schoolId,
        actorStaffId: entry.actorStaffId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: entry.before === undefined ? undefined : (entry.before as object),
        after: entry.after === undefined ? undefined : (entry.after as object),
        reason: entry.reason,
      },
    });
  }
}
