function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export type IdCardData = {
  schoolName: string;
  schoolAddress: string | null;
  schoolPhone: string | null;
  initials: string;
  name: string;
  admissionNo: string;
  classLabel: string;
  session: string;
  photoDataUrl: string | null;
  /** A leadership title — "Head Boy", "Senior Prefect". Null for most students, and then not shown. */
  position: string | null;
};

/**
 * FEATURES.md §3.7 — a printable card with photo, admission number, class,
 * session and school branding, extended with a leadership title for prefects.
 * Front and back, each its own printed page. Opens as a preview the person
 * can check before printing, rather than jumping straight to the dialog.
 */
export function printIdCard(data: IdCardData): void {
  const cardWindow = window.open("", "_blank", "width=480,height=800");
  if (!cardWindow) return;

  const photo = data.photoDataUrl
    ? `<img src="${data.photoDataUrl}" alt="" />`
    : `<div class="no-photo">No photo on file</div>`;
  const positionBadge = data.position ? `<div class="badge">${escapeHtml(data.position)}</div>` : "";
  const contact = [data.schoolPhone, data.schoolAddress]
    .filter((value): value is string => Boolean(value))
    .map(escapeHtml)
    .join(" · ");

  cardWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ID card — ${escapeHtml(data.name)}</title>
        <style>
          @page { margin: 10mm; }
          body {
            font-family: Arial, Helvetica, sans-serif; margin: 0;
            background: #eef3f7; min-height: 100vh;
            display: flex; flex-direction: column; align-items: center; gap: 10px;
            padding: 24px 0;
          }
          .print-bar { display: flex; gap: 8px; }
          .print-bar button {
            font-family: inherit; font-size: 14px; font-weight: 600; border-radius: 8px;
            padding: 8px 20px; border: none; cursor: pointer;
          }
          .print-bar .primary { background: #2d88d4; color: #fff; }
          .print-bar .secondary { background: #fff; color: #282828; border: 1px solid #b9c5ce; }
          .side-label { font-size: 12px; font-weight: 600; color: #4f4f4f; letter-spacing: 1px; }
          @media print {
            body { background: #fff; padding: 0; }
            .print-bar, .side-label { display: none; }
            .card:first-of-type { page-break-after: always; }
          }
          .card {
            width: 54mm; height: 86mm; border-radius: 4mm; overflow: hidden;
            border: 1px solid #b9c5ce; display: flex; flex-direction: column;
            background: #fff;
          }
          .head {
            background: #152259; color: #fcfafa; text-align: center;
            padding: 4mm 2mm 3mm;
          }
          .crest {
            width: 10mm; height: 10mm; border-radius: 50%; background: #2d88d4;
            color: #fcfafa; display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 4mm; margin: 0 auto 2mm;
          }
          .school { font-size: 2.6mm; font-weight: bold; letter-spacing: 0.3mm; }
          .tag { font-size: 2mm; margin-top: 1mm; opacity: 0.85; }
          .photo {
            width: 28mm; height: 32mm; margin: 4mm auto 2mm; border: 1px solid #b9c5ce;
            display: flex; align-items: center; justify-content: center; overflow: hidden;
            background: #eef3f7;
          }
          .photo img { width: 100%; height: 100%; object-fit: cover; }
          .no-photo { font-size: 2mm; color: #4f4f4f; text-align: center; padding: 2mm; }
          .name { text-align: center; font-weight: bold; font-size: 3.2mm; padding: 0 2mm; }
          .badge {
            margin: 1.5mm auto 0; background: #fff3c4; color: #8a6316; border: 0.3mm solid #dcc392;
            border-radius: 3mm; padding: 0.8mm 3mm; font-size: 2.2mm; font-weight: bold;
            text-transform: uppercase; letter-spacing: 0.2mm; width: fit-content;
          }
          .fields { padding: 3mm 4mm; font-size: 2.4mm; color: #282828; flex: 1; }
          .fields div { display: flex; justify-content: space-between; margin-top: 1.5mm; }
          .fields span.label { color: #4f4f4f; }
          .foot { text-align: center; font-size: 1.8mm; color: #4f4f4f; padding: 0 2mm 3mm; }
          .back-body { padding: 5mm 4mm; font-size: 2.3mm; color: #282828; flex: 1; display: flex; flex-direction: column; gap: 3mm; }
          .back-body .contact { color: #4f4f4f; }
          .signature { margin-top: auto; border-top: 0.3mm solid #282828; padding-top: 1.5mm; font-size: 2mm; color: #4f4f4f; }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <button class="primary" onclick="window.print()">Print this card</button>
          <button class="secondary" onclick="window.close()">Close</button>
        </div>

        <div class="side-label">FRONT</div>
        <div class="card">
          <div class="head">
            <div class="crest">${escapeHtml(data.initials)}</div>
            <div class="school">${escapeHtml(data.schoolName)}</div>
            <div class="tag">STUDENT IDENTITY CARD</div>
          </div>
          <div class="photo">${photo}</div>
          <div class="name">${escapeHtml(data.name)}</div>
          ${positionBadge}
          <div class="fields">
            <div><span class="label">Admission no.</span><span>${escapeHtml(data.admissionNo)}</span></div>
            <div><span class="label">Class</span><span>${escapeHtml(data.classLabel)}</span></div>
            <div><span class="label">Session</span><span>${escapeHtml(data.session)}</span></div>
          </div>
          <div class="foot">If found, please return to the school office.</div>
        </div>

        <div class="side-label">BACK</div>
        <div class="card">
          <div class="head">
            <div class="school">${escapeHtml(data.schoolName)}</div>
            ${contact ? `<div class="tag">${contact}</div>` : ""}
          </div>
          <div class="back-body">
            <p>This card is the property of ${escapeHtml(data.schoolName)} and must be surrendered on request.</p>
            <p>Valid for the ${escapeHtml(data.session)} session.</p>
            <div class="signature">Principal's signature</div>
          </div>
        </div>
      </body>
    </html>
  `);
  cardWindow.document.close();
  cardWindow.focus();
}
