export type SignInSlipData = {
  schoolName: string;
  name: string;
  email: string;
  temporaryPassword: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

const SIGN_IN_URL = "https://gvps-api-taupe.vercel.app/";

/**
 * A printable sign-in slip for a staff member. The temporary password only
 * exists for the moment it is shown, so the slip is printed then — it is never
 * sent by email (FEATURES.md §1.6). Styled per STITCH-GLOBAL.md's colour
 * system as a proper welcome document, not a plain field dump.
 */
export function printSignInSlip(data: SignInSlipData): void {
  const slipWindow = window.open("", "_blank", "width=560,height=760");
  if (!slipWindow) return;

  const firstName = data.name.split(" ")[0] || data.name;
  const initial = data.name.trim().charAt(0).toUpperCase() || "?";
  const printedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  slipWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Sign-in details: ${escapeHtml(data.name)}</title>
        <style>
          @page { margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, "Segoe UI", Arial, Helvetica, sans-serif; margin: 0; background: #eef3f7;
            min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            gap: 16px; padding: 32px 16px; color: #282828;
          }
          .print-bar { display: flex; gap: 8px; }
          .print-bar button {
            font-family: inherit; font-size: 14px; font-weight: 600; border-radius: 8px;
            padding: 9px 22px; border: none; cursor: pointer;
          }
          .print-bar .primary { background: #2d88d4; color: #fff; }
          .print-bar .secondary { background: #fff; color: #282828; border: 1px solid #b9c5ce; }
          @media print {
            body { background: #fff; padding: 0; gap: 0; }
            .print-bar { display: none; }
            .card { box-shadow: none; }
          }
          .card {
            width: 100%; max-width: 420px; border-radius: 16px; overflow: hidden;
            border: 1px solid #dee6ec; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          }
          .accent { height: 4px; background: #2d88d4; }
          .head { background: #152259; color: #fcfafa; padding: 28px 32px 24px; text-align: center; }
          .avatar {
            width: 52px; height: 52px; border-radius: 50%; background: #2d88d4; color: #fcfafa;
            display: flex; align-items: center; justify-content: center; font-weight: 700;
            font-size: 20px; margin: 0 auto 14px;
          }
          .school { font-size: 15px; font-weight: 700; letter-spacing: 0.2px; }
          .tag { font-size: 11px; margin-top: 4px; color: #b9c5ce; text-transform: uppercase; letter-spacing: 0.6px; }
          .body { padding: 28px 32px 8px; }
          .greeting { text-align: center; font-size: 19px; font-weight: 700; color: #282828; margin-bottom: 4px; }
          .sub { text-align: center; font-size: 13px; color: #4f4f4f; margin-bottom: 22px; }
          .field {
            border: 1px solid #dee6ec; background: #f7fafc; border-radius: 10px; padding: 12px 16px;
            margin-bottom: 12px;
          }
          .field .label {
            font-size: 10.5px; color: #4f4f4f; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600;
          }
          .field .value { font-size: 15px; font-weight: 600; color: #152259; margin-top: 3px; word-break: break-all; }
          .field .value.password { font-family: "IBM Plex Mono", "Courier New", monospace; font-size: 17px; letter-spacing: 0.5px; }
          .cta {
            display: block; text-align: center; background: #2d88d4; color: #fff !important; text-decoration: none;
            font-size: 14px; font-weight: 700; border-radius: 8px; padding: 12px; margin: 18px 0 6px;
          }
          .notice {
            margin: 18px 32px 0; border-left: 3px solid #dcc392; background: #f7eedc; color: #8a6316;
            border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 12.5px; line-height: 1.6;
          }
          .notice strong { color: #6b4b0f; }
          .foot {
            text-align: center; font-size: 11px; color: #4f4f4f; padding: 18px 20px 22px; margin-top: 8px;
            border-top: 1px solid #eef3f7;
          }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <button class="primary" onclick="window.print()">Print this slip</button>
          <button class="secondary" onclick="window.close()">Close</button>
        </div>

        <div class="card">
          <div class="accent"></div>
          <div class="head">
            <div class="avatar">${escapeHtml(initial)}</div>
            <div class="school">${escapeHtml(data.schoolName)}</div>
            <div class="tag">Staff account · Confidential</div>
          </div>
          <div class="body">
            <div class="greeting">Welcome, ${escapeHtml(firstName)}</div>
            <div class="sub">Here are your sign-in details.</div>
            <div class="field">
              <div class="label">Sign-in email</div>
              <div class="value">${escapeHtml(data.email)}</div>
            </div>
            <div class="field">
              <div class="label">Temporary password</div>
              <div class="value password">${escapeHtml(data.temporaryPassword)}</div>
            </div>
            <a class="cta" href="${SIGN_IN_URL}">Sign in at ${SIGN_IN_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
          </div>
          <div class="notice">
            <strong>Shown once.</strong> You will be asked to choose a new password the moment you sign in.
            Keep this slip private and destroy it once you have done so.
          </div>
          <div class="foot">Printed ${escapeHtml(printedOn)} · ${escapeHtml(data.schoolName)}</div>
        </div>
      </body>
    </html>
  `);
  slipWindow.document.close();
  slipWindow.focus();
  slipWindow.print();
}
