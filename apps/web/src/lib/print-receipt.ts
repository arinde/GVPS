export type ReceiptData = {
  schoolName: string;
  studentName: string;
  receiptNumber: string;
  amountKobo: number;
  method: string;
  reference: string | null;
  payerName: string;
  receivedByName: string;
  createdAt: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Opens a small print-ready window for one payment receipt — no PDF service yet, the browser's own print dialog does the job. */
export function printReceipt(data: ReceiptData): void {
  const receiptWindow = window.open("", "_blank", "width=420,height=640");
  if (!receiptWindow) return;

  const naira = (data.amountKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 });
  const date = new Date(data.createdAt).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows: [string, string][] = [
    ["Receipt number", data.receiptNumber],
    ["Date", date],
    ["Student", data.studentName],
    ["Amount", `₦${naira}`],
    ["Method", data.method + (data.reference ? ` (ref: ${data.reference})` : "")],
    ["Paid by", data.payerName],
    ["Received by", data.receivedByName],
  ];

  receiptWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${escapeHtml(data.receiptNumber)}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #282828; }
          h1 { font-size: 16px; margin: 0 0 4px; }
          p.subtitle { margin: 0 0 20px; color: #4f4f4f; font-size: 13px; }
          dl { margin: 0; }
          dt { font-size: 11px; color: #4f4f4f; margin-top: 12px; }
          dd { font-size: 14px; font-weight: 600; margin: 2px 0 0; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(data.schoolName)}</h1>
        <p class="subtitle">Payment receipt</p>
        <dl>
          ${rows.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}
        </dl>
      </body>
    </html>
  `);
  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}
