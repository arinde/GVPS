import { EnrolmentStatus, type Prisma } from "@prisma/client";
import type { PrismaService } from "@/prisma/prisma.service";
import type { ReceiptInput } from "@/fees/receipt";

type Db = PrismaService | Prisma.TransactionClient;
export type ReceiptContext = Omit<ReceiptInput, "receiptNumber" | "issuedAt" | "payment"> & {
  recordedByName: string;
};

/**
 * Everything a receipt prints except the payment itself. Read inside the same
 * transaction that inserts the payment, so the "paid before" figure can't race
 * with another payment on the same invoice.
 */
export async function gatherReceiptContext(
  db: Db,
  schoolId: string,
  invoiceId: string,
  recordedById: string,
): Promise<ReceiptContext> {
  const invoice = await db.invoice.findFirstOrThrow({
    where: { id: invoiceId, schoolId },
    include: { lineItems: true, payments: true },
  });
  const [school, student, term, recordedBy] = await Promise.all([
    db.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { name: true, address: true, phone: true, email: true, taxNumber: true, vatRateBps: true },
    }),
    db.student.findUniqueOrThrow({
      where: { id: invoice.studentId },
      select: { firstName: true, lastName: true, admissionNo: true },
    }),
    db.term.findUniqueOrThrow({
      where: { id: invoice.termId },
      select: { name: true, session: { select: { name: true, id: true } } },
    }),
    db.staff.findUnique({ where: { id: recordedById }, select: { firstName: true, lastName: true, email: true } }),
  ]);

  const enrolment = await db.enrolment.findFirst({
    where: { schoolId, studentId: invoice.studentId, sessionId: term.session.id, status: EnrolmentStatus.ACTIVE },
    select: { classArm: { select: { name: true, classLevel: { select: { name: true } } } } },
    orderBy: { enrolledOn: "desc" },
  });

  const paidBeforeKobo = invoice.payments
    .filter((payment) => !payment.reversedAt)
    .reduce((sum, payment) => sum + payment.amountKobo, 0);

  return {
    school: {
      name: school.name,
      address: school.address,
      phone: school.phone,
      email: school.email,
      taxNumber: school.taxNumber,
    },
    vatRateBps: school.vatRateBps,
    student: {
      name: `${student.lastName}, ${student.firstName}`,
      admissionNo: student.admissionNo,
      classLabel: enrolment ? `${enrolment.classArm.classLevel.name}${enrolment.classArm.name}` : null,
    },
    session: term.session.name,
    term: term.name,
    items: invoice.lineItems.map((item) => ({ name: item.name, amountKobo: item.amountKobo })),
    openingBalanceKobo: invoice.openingBalanceKobo,
    paidBeforeKobo,
    recordedByName: recordedBy
      ? recordedBy.firstName && recordedBy.lastName
        ? `${recordedBy.firstName} ${recordedBy.lastName}`
        : recordedBy.email
      : "—",
  };
}
