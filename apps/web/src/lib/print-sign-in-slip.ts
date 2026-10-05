export type SignInSlipData = {
  schoolName: string;
  name: string;
  email: string;
  temporaryPassword: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * A printable sign-in slip for a staff member. The temporary password only
 * exists for the moment it is shown, so the slip is printed then — it is never
 * sent by email (FEATURES.md §1.6).
 */
export function printSignInSlip(data: SignInSlipData): void {
  const slipWindow = window.open("", "_blank", "width=480,height=640");
  if (!slipWindow) return;

  slipWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Sign-in details: ${escapeHtml(data.name)}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 28px; color: #282828; }
          h1 { font-size: 16px; margin: 0 0 4px; }
          p.subtitle { margin: 0 0 24px; color: #4f4f4f; font-size: 13px; }
          dt { font-size: 11px; color: #4f4f4f; margin-top: 14px; }
          dd { font-size: 16px; font-weight: 600; margin: 2px 0 0; font-family: monospace; }
          .note { margin-top: 28px; font-size: 12px; color: #4f4f4f; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(data.schoolName)}</h1>
        <p class="subtitle">Staff sign-in details</p>
        <dl>
          <dt>Name</dt><dd>${escapeHtml(data.name)}</dd>
          <dt>Email (sign-in)</dt><dd>${escapeHtml(data.email)}</dd>
          <dt>Temporary password</dt><dd>${escapeHtml(data.temporaryPassword)}</dd>
        </dl>
        <p class="note">Sign in with these details. You will be asked to choose a new password straight away. Keep this slip private and destroy it once you have done so.</p>
      </body>
    </html>
  `);
  slipWindow.document.close();
  slipWindow.focus();
  slipWindow.print();
}
