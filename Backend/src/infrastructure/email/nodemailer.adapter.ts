import nodemailer from 'nodemailer';
import { EmailService } from './email.interface';

// Initialize the Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard Gmail. Can be changed to SMTP details if needed.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const nodemailerEmailService: EmailService = {
  async sendEmail({ to, subject, html, from }: { to: string; subject: string; html: string; from?: string }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS not configured — emails will not be sent");
      return;
    }

    try {
      const fromEmail = from || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER || "noreply@example.com";
      
      const info = await transporter.sendMail({
        from: `"AI Recruiter" <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      });

      console.log(`[NodeMailer] Message sent successfully to ${to}: %s`, info.messageId);
    } catch (error) {
      console.error("[NodeMailer] Error sending email:", error);
    }
  }
};
