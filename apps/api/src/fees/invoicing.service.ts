import { Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus, type Invoice, type InvoiceLineItem, type Payment } from "@prisma/client";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { computeInvoiceBalance, type InvoiceBalance } from "@/fees/invoice-balance";
import { PrismaService } from "@/prisma/prisma.service";

export type InvoiceWithDetail = Invoice & { lineItems: InvoiceLineItem[]; payments: Payment[] };

/**
 * Shared by the staff-side ledger read and the parent portal's read-only
 * fees view (FEATURES.md §14 "Invoices / payments" row grants parents read
 * access to their own wards') — each does its own access check first, then
 * calls this for the same query and balance computation.
 */
export async function fetchStudentLedger(prisma: PrismaService, schoolId: string, studentId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { schoolId, studentId },
    include: { lineItems: true, payments: true },
    orderBy: { createdAt: "asc" },
  });

  const withBalance = invoices.map((invoice) => ({ ...invoice, balance: computeInvoiceBalance(invoice) }));
  const outstanding = withBalance[withBalance.length - 1]?.balance.balance ?? 0;
  return { invoices: withBalance, outstanding };
}

/**
 * FEATURES.md §6.3 — generating the term's invoices from the fee structure,
 * and reading them back with a computed balance. Nothing here is a hard
 * delete or an in-place edit of money already billed (PLAN.md §4.5):
 * generating twice is a no-op for students who already have one, and a
 * correction is a new line item, not a rewrite of an old one.
 */
@Injectable()
export class InvoicingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One invoice per actively-enrolled student in the arm, for students who
   * don't already have one this term. Compulsory structure items are billed
   * automatically; optional ones are added afterward, per student.
   */
  async generateForArm(
    actor: AuthenticatedStaff,
    termId: string,
    classArmId: string,
  ): Promise<{ created: number; skipped: number }> {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId: actor.schoolId } });
    if (!term) throw new NotFoundException("Term not found.");

    const classArm = await this.prisma.classArm.findFirst({
      where: { id: classArmId, schoolId: actor.schoolId },
    });
    if (!classArm) throw new NotFoundException("Class not found.");

    const [enrolments, structure] = await Promise.all([
      this.prisma.enrolment.findMany({
        where: { schoolId: actor.schoolId, classArmId, sessionId: term.sessionId, status: EnrolmentStatus.ACTIVE },
        select: { studentId: true },
      }),
      this.prisma.feeStructureItem.findMany({
        where: { schoolId: actor.schoolId, termId, classLevelId: classArm.classLevelId, isCompulsory: true },
      }),
    ]);

    // FeeStructureItem has no formal relation to FeeItem (the lean,
    // cross-table-scalar convention used throughout this schema) — the name
    // is looked up here, once, rather than per invoice line below.
    const feeItems = await this.prisma.feeItem.findMany({
      where: { id: { in: structure.map((item) => item.feeItemId) } },
    });
    const feeItemName = new Map(feeItems.map((item) => [item.id, item.name]));

    let created = 0;
    let skipped = 0;

    for (const { studentId } of enrolments) {
      const existing = await this.prisma.invoice.findUnique({ where: { termId_studentId: { termId, studentId } } });
      if (existing) {
        skipped++;
        continue;
      }

      const openingBalanceKobo = await this.outstandingBalanceBefore(actor.schoolId, studentId, termId);

      await this.prisma.invoice.create({
        data: {
          schoolId: actor.schoolId,
          termId,
          studentId,
          openingBalanceKobo,
          createdById: actor.id,
          lineItems: {
            create: structure.map((item) => ({
              feeItemId: item.feeItemId,
              name: feeItemName.get(item.feeItemId) ?? "Fee",
              amountKobo: item.amountKobo,
            })),
          },
        },
      });
      created++;
    }

    return { created, skipped };
  }

  /** Adds one optional fee item to an already-generated invoice, priced from the current structure for that term. */
  async addLineItem(actor: AuthenticatedStaff, invoiceId: string, feeItemId: string): Promise<InvoiceLineItem> {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, schoolId: actor.schoolId } });
    if (!invoice) throw new NotFoundException("Invoice not found.");

    const feeItem = await this.prisma.feeItem.findFirst({ where: { id: feeItemId, schoolId: actor.schoolId } });
    if (!feeItem) throw new NotFoundException("Fee item not found.");

    // The class level the student was actually enrolled in for this
    // invoice's own term — not just "wherever they are now" — in case a
    // late addition is made after a promotion or transfer.
    const term = await this.prisma.term.findFirstOrThrow({ where: { id: invoice.termId } });
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { schoolId: actor.schoolId, studentId: invoice.studentId, sessionId: term.sessionId },
      select: { classArm: { select: { classLevelId: true } } },
      orderBy: { enrolledOn: "desc" },
    });
    const structureItem = enrolment
      ? await this.prisma.feeStructureItem.findUnique({
          where: {
            termId_classLevelId_feeItemId: {
              termId: invoice.termId,
              classLevelId: enrolment.classArm.classLevelId,
              feeItemId,
            },
          },
        })
      : null;

    return this.prisma.invoiceLineItem.create({
      data: {
        invoiceId,
        feeItemId,
        name: feeItem.name,
        amountKobo: structureItem?.amountKobo ?? 0,
      },
    });
  }

  async getInvoice(
    actor: AuthenticatedStaff,
    invoiceId: string,
  ): Promise<InvoiceWithDetail & { balance: InvoiceBalance }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, schoolId: actor.schoolId },
      include: { lineItems: true, payments: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found.");
    return { ...invoice, balance: computeInvoiceBalance(invoice) };
  }

  getStudentLedger(actor: AuthenticatedStaff, studentId: string) {
    return fetchStudentLedger(this.prisma, actor.schoolId, studentId);
  }

  /** The balance on the student's most recently generated prior invoice — the full cumulative arrears at this point. */
  private async outstandingBalanceBefore(
    schoolId: string,
    studentId: string,
    excludingTermId: string,
  ): Promise<number> {
    const prior = await this.prisma.invoice.findFirst({
      where: { schoolId, studentId, termId: { not: excludingTermId } },
      include: { lineItems: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
    return prior ? computeInvoiceBalance(prior).balance : 0;
  }
}
