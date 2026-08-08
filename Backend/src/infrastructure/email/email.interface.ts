/**
 * Abstract email service interface
 */
export interface EmailService {
  send(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ id: string }>;
}
