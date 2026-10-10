import type { ReceiptSnapshot } from "@/fees/receipt";

const naira = (kobo: number) => {
  const sign = kobo < 0 ? "-" : "";
  return `${sign}₦${(Math.abs(kobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function line(label: string, value: string, strong = false): string {
  const weight = strong ? "font-weight:bold;" : "";
  return `<tr><td style="padding:6px 8px;border-bottom:1px solid #dee6ec;${weight}">${escape(label)}</td><td style="padding:6px 8px;border-bottom:1px solid #dee6ec;text-align:right;white-space:nowrap;${weight}">${escape(value)}</td></tr>`;
}

function balance(kobo: number): string {
  if (kobo > 0) return naira(kobo);
  if (kobo === 0) return "₦0.00 (fully paid)";
  return `${naira(-kobo)} credit`;
}

/**
 * The receipt a guardian gets by email: the same figures as the printed receipt
 * (FEATURES.md §6.4), rendered with inline styles so mail clients keep the layout.
 */
export function renderReceiptEmail(receipt: ReceiptSnapshot, guardianFirstName: string): string {
  const { school, student, payment, vat } = receipt;
  const contact = [school.phone, school.email].filter(Boolean).join(" · ");
  const issued = new Date(receipt.issuedAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" });
  const carried =
    receipt.openingBalanceKobo > 0 ? line("Carried forward from earlier terms", naira(receipt.openingBalanceKobo)) : "";
  const items = receipt.items.map((item) => line(item.name, naira(item.amountKobo))).join("");
  const method = payment.method.toLowerCase() + (payment.reference ? ` (ref: ${payment.reference})` : "");
  const vatText =
    vat.rateBps === 0
      ? "VAT: not charged on these fees"
      : `VAT included at ${vat.rateBps / 100}%: ${naira(vat.vatKobo)} · amount before VAT ${naira(vat.netKobo)}`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#282828;font-size:14px;max-width:640px;">
      <p>Hello ${escape(guardianFirstName)},</p>
      <p>We have received a payment for ${escape(student.name)} at ${escape(school.name)}. Your official receipt is below.</p>

      <div style="text-align:center;border-bottom:2px solid #152259;padding-bottom:10px;margin-top:16px;">
        <div style="font-size:20px;font-weight:bold;color:#152259;">${escape(school.name)}</div>
        ${school.address ? `<div style="color:#4f4f4f;">${escape(school.address)}</div>` : ""}
        ${contact ? `<div style="color:#4f4f4f;">${escape(contact)}</div>` : ""}
        ${school.taxNumber ? `<div style="color:#4f4f4f;">Tax identification no: ${escape(school.taxNumber)}</div>` : ""}
      </div>

      <div style="margin:14px 0 8px;font-weight:bold;letter-spacing:1px;">OFFICIAL RECEIPT <span style="float:right;font-weight:normal;">No. ${escape(receipt.receiptNumber)}</span></div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px;">
        <tr><td style="padding:3px 0;color:#4f4f4f;">Student</td><td style="text-align:right;">${escape(student.name)}</td></tr>
        <tr><td style="padding:3px 0;color:#4f4f4f;">Admission no.</td><td style="text-align:right;">${escape(student.admissionNo)}</td></tr>
        <tr><td style="padding:3px 0;color:#4f4f4f;">Class</td><td style="text-align:right;">${escape(student.classLabel ?? "—")}</td></tr>
        <tr><td style="padding:3px 0;color:#4f4f4f;">Session and term</td><td style="text-align:right;">${escape(receipt.session)} · ${escape(receipt.term)}</td></tr>
        <tr><td style="padding:3px 0;color:#4f4f4f;">Date issued</td><td style="text-align:right;">${escape(issued)}</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr><th style="text-align:left;padding:6px 8px;background:#eef3f7;">Fee item</th><th style="text-align:right;padding:6px 8px;background:#eef3f7;">Amount</th></tr></thead>
        <tbody>
          ${carried}
          ${items}
          ${line("Total due this term", naira(receipt.totalDueKobo), true)}
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:14px;">
        <tbody>
          ${line("Amount received", naira(payment.amountKobo), true)}
          ${line("Method", method)}
          ${line("Paid by", payment.payerName)}
          ${line("Received by", payment.receivedByName)}
          ${line("Paid before this receipt", naira(receipt.paidBeforeKobo))}
          ${line("Balance before this payment", balance(receipt.balanceBeforeKobo))}
          ${line("Balance after this payment", balance(receipt.balanceAfterKobo), true)}
        </tbody>
      </table>
      <p style="font-size:12px;color:#4f4f4f;margin-top:8px;">${escape(vatText)}</p>
      <p style="font-size:11px;color:#4f4f4f;margin-top:18px;">Computer-generated receipt. Keep it for your records. Payments are not refundable; a mistake is reversed and recorded.</p>
    </div>
  `;
}
