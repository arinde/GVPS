import type { ReceiptSnapshot } from "@/store/api/fees-api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function naira(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(kobo) / 100;
  return `${sign}₦${abs.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function row(label: string, value: string, emphasis = false): string {
  const cls = emphasis ? ' class="strong"' : "";
  return `<tr${cls}><td>${escapeHtml(label)}</td><td class="num">${escapeHtml(value)}</td></tr>`;
}

function balanceLine(kobo: number): string {
  if (kobo > 0) return naira(kobo);
  if (kobo === 0) return "₦0.00 (fully paid)";
  return `${naira(-kobo)} credit`;
}

function vatLine(receipt: ReceiptSnapshot): string {
  const { rateBps, vatKobo, netKobo } = receipt.vat;
  if (rateBps === 0) return "VAT: not charged on these fees";
  const rate = (rateBps / 100).toString();
  return `VAT included at ${rate}%: ${naira(vatKobo)} · amount before VAT ${naira(netKobo)}`;
}

/** The printed receipt for one payment, built from the snapshot taken when it was recorded. */
export function printReceipt(receipt: ReceiptSnapshot): void {
  const receiptWindow = window.open("", "_blank", "width=820,height=900");
  if (!receiptWindow) return;

  const issued = new Date(receipt.issuedAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" });
  const school = receipt.school;
  const contact = [school.phone, school.email].filter(Boolean).join(" · ");
  const items = receipt.items.map((item) => row(item.name, naira(item.amountKobo))).join("");
  const carried =
    receipt.openingBalanceKobo > 0 ? row("Carried forward from earlier terms", naira(receipt.openingBalanceKobo)) : "";
  const method = receipt.payment.method + (receipt.payment.reference ? ` · ref ${receipt.payment.reference}` : "");

  receiptWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${escapeHtml(receipt.receiptNumber)}</title>
        <style>
          @page { margin: 14mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #282828; font-size: 12px; margin: 0; }
          .head { text-align: center; border-bottom: 2px solid #152259; padding-bottom: 10px; }
          .head h1 { font-size: 20px; margin: 0; color: #152259; }
          .head p { margin: 3px 0; color: #4f4f4f; }
          .title { display: flex; justify-content: space-between; margin: 14px 0 6px; }
          .title strong { font-size: 15px; letter-spacing: 1px; }
          .reversed { color: #9b2226; font-weight: bold; border: 2px solid #9b2226; padding: 4px 8px; text-align: center; margin: 8px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin: 10px 0 14px; }
          .grid div span { color: #4f4f4f; font-size: 11px; display: block; }
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #dee6ec; }
          th { background: #eef3f7; font-size: 11px; color: #424242; }
          .num { text-align: right; white-space: nowrap; }
          tr.strong td { font-weight: bold; border-top: 1px solid #b9c5ce; }
          .section { margin-top: 14px; font-weight: bold; color: #152259; font-size: 12px; }
          .vat { margin-top: 8px; font-size: 11px; color: #4f4f4f; }
          .sign { margin-top: 36px; display: flex; justify-content: space-between; font-size: 11px; color: #4f4f4f; }
          .sign div { border-top: 1px solid #282828; padding-top: 4px; width: 42%; }
          .foot { margin-top: 18px; font-size: 10px; color: #4f4f4f; text-align: center; }
        </style>
      </head>
      <body>
        <div class="head">
          <h1>${escapeHtml(school.name)}</h1>
          ${school.address ? `<p>${escapeHtml(school.address)}</p>` : ""}
          ${contact ? `<p>${escapeHtml(contact)}</p>` : ""}
          ${school.taxNumber ? `<p>Tax identification no: ${escapeHtml(school.taxNumber)}</p>` : ""}
        </div>

        <div class="title">
          <strong>OFFICIAL RECEIPT</strong>
          <span>No. ${escapeHtml(receipt.receiptNumber)}</span>
        </div>
        ${receipt.reversed ? `<div class="reversed">REVERSED${receipt.reversalReason ? ` — ${escapeHtml(receipt.reversalReason)}` : ""}</div>` : ""}

        <div class="grid">
          <div><span>Received from</span>${escapeHtml(receipt.payment.payerName)}</div>
          <div><span>Date issued</span>${escapeHtml(issued)}</div>
          <div><span>Student</span>${escapeHtml(receipt.student.name)}</div>
          <div><span>Admission no.</span>${escapeHtml(receipt.student.admissionNo)}</div>
          <div><span>Class</span>${escapeHtml(receipt.student.classLabel ?? "—")}</div>
          <div><span>Session and term</span>${escapeHtml(receipt.session)} · ${escapeHtml(receipt.term)}</div>
        </div>

        <table>
          <thead><tr><th>Fee item</th><th class="num">Amount</th></tr></thead>
          <tbody>
            ${carried}
            ${items}
            ${row("Total due this term", naira(receipt.totalDueKobo), true)}
          </tbody>
        </table>

        <p class="section">Payment</p>
        <table>
          <tbody>
            ${row("Amount received", naira(receipt.payment.amountKobo), true)}
            ${row("Method", method)}
            ${row("Received by", receipt.payment.receivedByName)}
            ${row("Recorded by", receipt.payment.recordedByName)}
            ${row("Paid before this receipt", naira(receipt.paidBeforeKobo))}
            ${row("Balance before this payment", balanceLine(receipt.balanceBeforeKobo))}
            ${row("Balance after this payment", balanceLine(receipt.balanceAfterKobo), true)}
          </tbody>
        </table>
        <p class="vat">${escapeHtml(vatLine(receipt))}</p>

        <div class="sign">
          <div>Received by (signature)</div>
          <div>Authorised by (bursar)</div>
        </div>
        <p class="foot">Computer-generated receipt. Keep it for your records. Payments are not refundable; a mistake is reversed and recorded.</p>
      </body>
    </html>
  `);
  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}
