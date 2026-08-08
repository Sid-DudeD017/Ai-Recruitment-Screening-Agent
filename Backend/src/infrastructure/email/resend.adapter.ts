import { Resend } from "resend";
import type { EmailService } from "./email.interface";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("resend-email");

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("RESEND_API_KEY not configured — emails will not be sent");
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export const resendEmailService: EmailService = {
  async send({ to, subject, html, from }) {
    const client = getResendClient();
    if (!client) {
      logger.warn({ to, subject }, "Email skipped — Resend not configured");
      return { id: "skipped" };
    }

    const fromEmail = from || process.env.RESEND_FROM_EMAIL || "noreply@example.com";

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to, subject }, "Failed to send email");
      throw new Error(`Email send failed: ${error.message}`);
    }

    logger.info({ emailId: data?.id, to, subject }, "Email sent");
    return { id: data?.id || "unknown" };
  },
};
