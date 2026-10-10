import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "@/audit/audit.service";
import { renderEmailFooter } from "@/common/email-footer";
import { PrismaService } from "@/prisma/prisma.service";

export type SendEmailInput = {
  schoolId: string;
  actorStaffId: string | null;
  /** The record the email is about, so the trail can be followed back to it. */
  entityType: string;
  entityId: string;
  to: string;
  subject: string;
  html: string;
};

const SENDLIB_URL = "https://sendlib.samueltuoyo.com/api/send";

/**
 * Sends through Sendlib (sends via a connected Gmail account, so no domain is
 * needed). Temporary: switch back to Resend once the school's domain is
 * verified. Every attempt — sent, failed or skipped — is written to the audit
 * log under the `email.*` actions, which is the email trail. A failed send is
 * logged, never thrown: a notification must not break the action it's
 * attached to.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string | undefined;

  constructor(
    config: ConfigService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = config.get<string>("SENDLIB_API_KEY") || undefined;
    this.from = config.get<string>("EMAIL_FROM") || undefined;
  }

  async send(input: SendEmailInput): Promise<void> {
    const { to, subject } = input;
    const target = { to, subject };

    if (!this.apiKey || !this.from) {
      this.logger.warn(`SENDLIB_API_KEY or EMAIL_FROM not set — skipped email "${subject}" to ${to}.`);
      await this.trail(input, "email.skipped", { ...target, reason: "Sending is not configured." });
      return;
    }

    const html = input.html + (await this.footer(input.schoolId));

    try {
      const response = await fetch(SENDLIB_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: this.from, to, subject, html }),
      });
      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).trim();
        const reason = `HTTP ${response.status} ${detail}`.trim();
        this.logger.warn(`Email "${subject}" to ${to} failed: ${reason}`);
        await this.trail(input, "email.failed", { ...target, reason });
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { messageId?: string };
      await this.trail(input, "email.sent", { ...target, providerMessageId: body.messageId ?? null });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Email "${subject}" to ${to} failed: ${reason}`);
      await this.trail(input, "email.failed", { ...target, reason });
    }
  }

  /** Every email gets the same signature block, the way a mail client always appends one. */
  private async footer(schoolId: string): Promise<string> {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { name: true, address: true, phone: true, email: true },
      });
      return school ? renderEmailFooter(school) : "";
    } catch (error) {
      this.logger.error(`Could not load the school profile for the email footer: ${String(error)}`);
      return "";
    }
  }

  private async trail(input: SendEmailInput, action: string, after: Record<string, unknown>): Promise<void> {
    try {
      await this.audit.record({
        schoolId: input.schoolId,
        actorStaffId: input.actorStaffId,
        action,
        entityType: input.entityType,
        entityId: input.entityId,
        after,
        reason: typeof after.reason === "string" ? after.reason : undefined,
      });
    } catch (error) {
      this.logger.error(`Could not write the email trail for "${input.subject}": ${String(error)}`);
    }
  }
}
