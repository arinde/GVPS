const escape = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export type FooterSchool = { name: string; address: string | null; phone: string | null; email: string | null };

/**
 * Appended to every outgoing email (FEATURES.md §7.1), the way a mail client's
 * own signature always sits under every message. Pulled from the same School
 * profile the receipt uses, so there is one place to update the details.
 */
export function renderEmailFooter(school: FooterSchool): string {
  const contact = [school.phone, school.email].filter(Boolean).join(" · ");
  return `
    <hr style="margin-top:24px;border:none;border-top:1px solid #dee6ec;" />
    <p style="font-size:11px;color:#4f4f4f;font-family:Arial,Helvetica,sans-serif;margin-top:8px;">
      ${escape(school.name)}${school.address ? ` · ${escape(school.address)}` : ""}<br/>
      ${contact ? `${escape(contact)}<br/>` : ""}
      This is an automated message. Please contact the school office directly rather than replying to this email.
    </p>
  `;
}
