import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export const EMAIL_ACTIONS = ["email.sent", "email.failed", "email.skipped"] as const;

export type EmailTrailItem = {
  id: string;
  createdAt: Date;
  status: "sent" | "failed" | "skipped";
  recipient: string;
  subject: string;
  reason: string | null;
  relatedTo: string;
  sentBy: string | null;
};

/** Reads the `email.*` entries the EmailService writes into the audit log. */
@Injectable()
export class AuditTrailService {
  constructor(private readonly prisma: PrismaService) {}

  async emails(schoolId: string, page: number, pageSize: number) {
    const where = { schoolId, action: { in: [...EMAIL_ACTIONS] } };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Staff are not related to audit rows in the schema (lean convention), so
    // the senders' names come from one batched lookup.
    const senderIds = [...new Set(rows.map((row) => row.actorStaffId).filter((id): id is string => id !== null))];
    const senders = senderIds.length
      ? await this.prisma.staff.findMany({
          where: { id: { in: senderIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const senderName = new Map(
      senders.map((staff) => [
        staff.id,
        staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : staff.email,
      ]),
    );

    const items: EmailTrailItem[] = rows.map((row) => {
      const detail = (row.after ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        createdAt: row.createdAt,
        status: row.action === "email.sent" ? "sent" : row.action === "email.failed" ? "failed" : "skipped",
        recipient: typeof detail.to === "string" ? detail.to : "—",
        subject: typeof detail.subject === "string" ? detail.subject : "—",
        reason: row.reason,
        relatedTo: `${row.entityType} ${row.entityId}`,
        sentBy: row.actorStaffId ? (senderName.get(row.actorStaffId) ?? null) : null,
      };
    });

    return { items, total, page, pageSize };
  }
}
