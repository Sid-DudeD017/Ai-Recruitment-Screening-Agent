import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { z } from "zod";

const generateEmailSchema = z.object({
  type: z.enum(["interview_invite", "rejection", "offer", "status_update"]),
  candidateName: z.string().min(1),
  jobTitle: z.string().min(1),
  companyName: z.string().min(1),
  additionalContext: z.string().optional(),
  interviewDate: z.string().optional(),
  meetingLink: z.string().optional(),
  location: z.string().optional(),
  templateStructure: z.string().optional(),
  templateSubject: z.string().optional(),
});

/**
 * POST /api/ai/generate-email
 * Generate professional email content using AI or customized template structure
 */
export const POST = routeHandler(
  {
    bodySchema: generateEmailSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { body }) => {
    // If a custom template structure is supplied, perform placeholder interpolation
    if (body.templateStructure && body.templateStructure.trim().length > 0) {
      let interpolatedBody = body.templateStructure
        .replaceAll("{candidate_name}", body.candidateName)
        .replaceAll("{job_title}", body.jobTitle)
        .replaceAll("{company_name}", body.companyName)
        .replaceAll("{interview_date}", body.interviewDate || "To be confirmed")
        .replaceAll("{meeting_link}", body.meetingLink || "Link to be shared")
        .replaceAll("{location}", body.location || "Virtual / Online");

      let interpolatedSubject = (body.templateSubject || (body.type === "rejection" ? "Application Update - {job_title}" : "Interview Invitation - {job_title}"))
        .replaceAll("{candidate_name}", body.candidateName)
        .replaceAll("{job_title}", body.jobTitle)
        .replaceAll("{company_name}", body.companyName);

      return successResponse({
        subject: interpolatedSubject,
        body: interpolatedBody,
      });
    }

    // Otherwise fallback to AI service generation with additional context
    const contextWithDetails = [
      body.additionalContext,
      body.interviewDate ? `Interview Date: ${body.interviewDate}` : null,
      body.meetingLink ? `Meeting Link: ${body.meetingLink}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const result = await aiClient.generateEmail({
      ...body,
      additionalContext: contextWithDetails,
    });
    return successResponse(result);
  }
);
