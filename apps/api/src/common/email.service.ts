import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

export type SendEmailInput = { to: string; subject: string; html: string };

/**
 * Thin wrapper around Resend. A failed send is logged, never thrown — a
 * notification email must not break the business action it's attached to
 * (issuing portal access, recording a payment). Until a verified domain
 * exists, Resend's own sandbox silently rejects any recipient other than the
 * account owner's email (FEATURES.md §7.1: email is secondary anyway) —
 * expected during this phase, not a bug to chase.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = config.get<string>("EMAIL_FROM") ?? "onboarding@resend.dev";
  }

  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not set — skipped email "${subject}" to ${to}.`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (error) this.logger.warn(`Email "${subject}" to ${to} failed: ${error.message}`);
    } catch (error) {
      this.logger.warn(`Email "${subject}" to ${to} failed: ${error instanceof Error ? error.message : error}`);
    }
  }
}
