// ============================================================================
// Email Templates — HTML templates for transactional emails
// ============================================================================

export function interviewInviteTemplate(data: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date;
  durationMinutes: number;
  type: string;
  meetingLink?: string;
  location?: string;
}): { subject: string; html: string } {
  const dateStr = data.scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    subject: `Interview Invitation — ${data.jobTitle} at ${data.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Interview Invitation</h2>
        <p>Dear ${data.candidateName},</p>
        <p>We are pleased to invite you for an interview for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Date & Time:</strong> ${dateStr}</p>
          <p><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
          <p><strong>Type:</strong> ${data.type}</p>
          ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ""}
          ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ""}
        </div>
        <p>Please confirm your attendance by replying to this email.</p>
        <p>Best regards,<br/>${data.companyName} Hiring Team</p>
      </div>
    `,
  };
}

export function applicationStatusTemplate(data: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  status: string;
  message?: string;
}): { subject: string; html: string } {
  const statusMessages: Record<string, string> = {
    SCREENING: "Your application is currently being reviewed by our team.",
    SHORTLISTED: "Congratulations! You have been shortlisted for the next stage.",
    INTERVIEW: "You have been selected for an interview. We will share the details shortly.",
    OFFERED: "We are excited to extend an offer to you! Details will follow.",
    HIRED: "Welcome aboard! We are thrilled to have you join our team.",
    REJECTED: "After careful consideration, we have decided to move forward with other candidates. We wish you the best in your future endeavors.",
  };

  return {
    subject: `Application Update — ${data.jobTitle} at ${data.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Status Update</h2>
        <p>Dear ${data.candidateName},</p>
        <p>We wanted to update you on your application for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Status:</strong> ${data.status}</p>
          <p>${statusMessages[data.status] || data.message || ""}</p>
        </div>
        <p>Thank you for your interest in joining our team.</p>
        <p>Best regards,<br/>${data.companyName} Hiring Team</p>
      </div>
    `,
  };
}

export function welcomeTemplate(data: {
  userName: string;
  companyName: string;
}): { subject: string; html: string } {
  return {
    subject: `Welcome to ${data.companyName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${data.companyName}!</h2>
        <p>Hi ${data.userName},</p>
        <p>Your account has been set up successfully. You can now start using the recruitment platform.</p>
        <p>Best regards,<br/>The ${data.companyName} Team</p>
      </div>
    `,
  };
}
