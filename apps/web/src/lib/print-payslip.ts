import { formatKobo } from "@/lib/money";
import type { PayLine, PrintablePayslip } from "@/store/api/payroll-api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function row(label: string, kobo: number, emphasis = false): string {
  const cls = emphasis ? ' class="strong"' : "";
  return `<tr${cls}><td>${escapeHtml(label)}</td><td class="num">${escapeHtml(formatKobo(kobo))}</td></tr>`;
}

function lines(items: PayLine[]): string {
  return items.map((item) => row(item.name, item.amountKobo)).join("");
}

function account(payslip: PrintablePayslip): string {
  const { bankName, accountNumberMasked, accountName } = payslip.staff;
  if (!bankName && !accountNumberMasked) return "Not on record";
  return [bankName, accountNumberMasked, accountName].filter(Boolean).join(" · ");
}

function page(payslip: PrintablePayslip): string {
  const school = payslip.school;
  const contact = [school.phone, school.email].filter(Boolean).join(" · ");
  const deductions =
    payslip.deductions.length > 0 ? lines(payslip.deductions) : `<tr><td colspan="2" class="muted">None</td></tr>`;

  return `
    <section class="slip">
      <div class="head">
        <h1>${escapeHtml(school.name)}</h1>
        ${school.address ? `<p>${escapeHtml(school.address)}</p>` : ""}
        ${contact ? `<p>${escapeHtml(contact)}</p>` : ""}
      </div>
      <div class="title"><strong>PAYSLIP</strong><span>${escapeHtml(payslip.label)}</span></div>
      ${payslip.status === "DRAFT" ? `<div class="draft">DRAFT — not yet finalised, figures may change</div>` : ""}
      <div class="grid">
        <div><span>Staff member</span>${escapeHtml(payslip.staff.name)}</div>
        <div><span>Email</span>${escapeHtml(payslip.staff.email)}</div>
        <div><span>Paid into</span>${escapeHtml(account(payslip))}</div>
        <div><span>Pay period</span>${escapeHtml(payslip.label)}</div>
      </div>
      <table>
        <thead><tr><th>Earnings</th><th class="num">Amount</th></tr></thead>
        <tbody>
          ${row("Basic salary", payslip.basicKobo)}
          ${lines(payslip.allowances)}
          ${row("Gross pay", payslip.grossKobo, true)}
        </tbody>
      </table>
      <table>
        <thead><tr><th>Deductions</th><th class="num">Amount</th></tr></thead>
        <tbody>
          ${deductions}
          ${row("Total deductions", payslip.deductionsKobo, true)}
        </tbody>
      </table>
      <table class="net"><tbody>${row("Net pay", payslip.netKobo, true)}</tbody></table>
      <div class="sign"><div>Prepared by (bursar)</div><div>Approved by</div></div>
      <p class="foot">Computer-generated payslip. Confidential — for the named staff member only.</p>
    </section>`;
}

/** Prints one or many payslips, one per page, from the figures as stored on the payroll. */
export function printPayslips(payslips: PrintablePayslip[], title: string): void {
  if (payslips.length === 0) return;
  const printWindow = window.open("", "_blank", "width=820,height=900");
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 14mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #282828; font-size: 12px; margin: 0; }
          .slip { break-after: page; }
          .slip:last-child { break-after: auto; }
          .head { text-align: center; border-bottom: 2px solid #152259; padding-bottom: 10px; }
          .head h1 { font-size: 20px; margin: 0; color: #152259; }
          .head p { margin: 3px 0; color: #4f4f4f; }
          .title { display: flex; justify-content: space-between; margin: 14px 0 6px; }
          .title strong { font-size: 15px; letter-spacing: 1px; }
          .draft { color: #9b2226; font-weight: bold; border: 2px solid #9b2226; padding: 4px 8px; text-align: center; margin: 8px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin: 10px 0 14px; }
          .grid div span { color: #4f4f4f; font-size: 11px; display: block; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #dee6ec; }
          th { background: #eef3f7; font-size: 11px; color: #424242; }
          .num { text-align: right; white-space: nowrap; }
          .muted { color: #4f4f4f; }
          tr.strong td { font-weight: bold; border-top: 1px solid #b9c5ce; }
          table.net td { font-size: 14px; border: 2px solid #152259; }
          .sign { margin-top: 36px; display: flex; justify-content: space-between; font-size: 11px; color: #4f4f4f; }
          .sign div { border-top: 1px solid #282828; padding-top: 4px; width: 42%; }
          .foot { margin-top: 18px; font-size: 10px; color: #4f4f4f; text-align: center; }
        </style>
      </head>
      <body>${payslips.map(page).join("")}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
