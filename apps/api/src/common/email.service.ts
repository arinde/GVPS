import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type SendEmailInput = { to: string; subject: string; html: string };

const SENDLIB_URL = "https://sendlib.samueltuoyo.com/api/send";

/**
 * Sends through Sendlib (sends via a connected Gmail account, so no domain is
 * needed). Temporary: switch back to Resend once the school's domain is
 * verified. A failed send is logged, never thrown — a notification email must
 * not break the business action it's attached to (issuing portal access,
 * recording a payment).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string | undefined;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>("SENDLIB_API_KEY") || undefined;
    this.from = config.get<string>("EMAIL_FROM") || undefined;
  }

  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    if (!this.apiKey || !this.from) {
      this.logger.warn(`SENDLIB_API_KEY or EMAIL_FROM not set — skipped email "${subject}" to ${to}.`);
      return;
    }

    try {
      const response = await fetch(SENDLIB_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: this.from, to, subject, html }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        this.logger.warn(`Email "${subject}" to ${to} failed: HTTP ${response.status} ${detail}`.trim());
      }
    } catch (error) {
      this.logger.warn(`Email "${subject}" to ${to} failed: ${error instanceof Error ? error.message : error}`);
    }
  }
}
