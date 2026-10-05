import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Payment, Prisma } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { EmailService } from "@/common/email.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import { buildReceipt } from "@/fees/receipt";
import { gatherReceiptContext } from "@/fees/receipt-context";
import type { RecordPaymentDto } from "@/fees/schemas/fees.schemas";

/**
 * FEATURES.md §6.4 — bursar-recorded offline payments. PLAN.md §4.5: never a
 * hard delete; a mistake is reversed, with a mandatory reason, never edited
 * or removed. Receipt numbers use the same atomic-counter pattern as
 * admission numbers (AdmissionNumberService) — incremented inside the same
 * transaction as the payment insert, so two bursars recording at once still
 * get distinct numbers.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  async record(actor: AuthenticatedStaff, invoiceId: string, dto: RecordPaymentDto): Promise<Payment> {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, schoolId: actor.schoolId } });
    if (!invoice) throw new NotFoundException("Invoice not found.");

    const year = new Date().getFullYear();
    const payment = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.receiptCounter.upsert({
        where: { schoolId_year: { schoolId: actor.schoolId, year } },
        create: { schoolId: actor.schoolId, year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const receiptNumber = `RCT/${year}/${String(counter.lastNumber).padStart(4, "0")}`;
      const issuedAt = new Date();
      const { recordedByName, ...context } = await gatherReceiptContext(tx, actor.schoolId, invoiceId, actor.id);
      const receipt = buildReceipt({
        ...context,
        receiptNumber,
        issuedAt: issuedAt.toISOString(),
        payment: {
          amountKobo: dto.amountKobo,
          method: dto.method,
          reference: dto.reference ?? null,
          payerName: dto.payerName,
          receivedByName: dto.receivedByName,
          recordedByName,
        },
      });

      return tx.payment.create({
        data: {
          schoolId: actor.schoolId,
          invoiceId,
          receiptNumber,
          amountKobo: dto.amountKobo,
          method: dto.method,
          reference: dto.reference,
          payerName: dto.payerName,
          receivedByName: dto.receivedByName,
          recordedById: actor.id,
          receipt: receipt as unknown as Prisma.InputJsonValue,
          createdAt: issuedAt,
        },
      });
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "fees.payment.recorded",
      entityType: "Payment",
      entityId: payment.id,
      after: {
        invoiceId,
        amountKobo: dto.amountKobo,
        method: dto.method,
        receiptNumber: payment.receiptNumber,
        payerName: dto.payerName,
        receivedByName: dto.receivedByName,
      },
    });

    await this.notifyReceipt(actor.id, actor.schoolId, invoice.studentId, payment);
    return payment;
  }

  /** The receipt exactly as issued, marked if the payment has since been reversed. */
  async receiptFor(actor: AuthenticatedStaff, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, schoolId: actor.schoolId },
      select: { receipt: true, reversedAt: true, reversalReason: true },
    });
    if (!payment) throw new NotFoundException("Payment not found.");
    if (!payment.receipt) {
      throw new NotFoundException("This payment was recorded before receipts were kept, so it cannot be reprinted.");
    }
    return {
      ...(payment.receipt as object),
      reversed: payment.reversedAt !== null,
      reversalReason: payment.reversalReason,
    };
  }

  async reverse(actor: AuthenticatedStaff, paymentId: string, reason: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, schoolId: actor.schoolId } });
    if (!payment) throw new NotFoundException("Payment not found.");
    if (payment.reversedAt) throw new ConflictException("This payment has already been reversed.");

    const reversed = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { reversedAt: new Date(), reversedById: actor.id, reversalReason: reason },
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "fees.payment.reversed",
      entityType: "Payment",
      entityId: paymentId,
      before: { reversedAt: null },
      after: { reason, receiptNumber: payment.receiptNumber },
    });

    return reversed;
  }

  /** Confirmation of the payment, not a legal receipt — a receipt PDF is a separate, not-yet-built capability. */
  private async notifyReceipt(
    actorStaffId: string,
    schoolId: string,
    studentId: string,
    payment: Payment,
  ): Promise<void> {
    const [guardianLink, school, student] = await Promise.all([
      this.prisma.studentGuardian.findFirst({
        where: { studentId, guardian: { email: { not: null } } },
        include: { guardian: true },
      }),
      this.prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
      this.prisma.student.findUnique({ where: { id: studentId }, select: { firstName: true, lastName: true } }),
    ]);
    if (!guardianLink?.guardian.email || !student) return;

    const schoolName = school?.name ?? "your child's school";
    const naira = (payment.amountKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 });

    await this.email.send({
      schoolId,
      actorStaffId,
      entityType: "Payment",
      entityId: payment.id,
      to: guardianLink.guardian.email,
      subject: `Payment received — receipt ${payment.receiptNumber}`,
      html: `
        <p>Hello ${guardianLink.guardian.firstName},</p>
        <p>We have received a payment of <strong>₦${naira}</strong> for ${student.firstName} ${student.lastName}
           at ${schoolName}.</p>
        <p>Receipt number: <strong>${payment.receiptNumber}</strong></p>
        <p>Method: ${payment.method.toLowerCase()}${payment.reference ? ` (ref: ${payment.reference})` : ""}</p>
        <p>Paid by: ${payment.payerName}</p>
        <p>Received by: ${payment.receivedByName}</p>
      `,
    });
  }
}
