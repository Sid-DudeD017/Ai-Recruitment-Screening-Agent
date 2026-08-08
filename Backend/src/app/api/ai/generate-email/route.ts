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
});

/**
 * POST /api/ai/generate-email
 * Generate professional email content using AI
 */
export const POST = routeHandler(
  {
    bodySchema: generateEmailSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { body }) => {
    const result = await aiClient.generateEmail(body);
    return successResponse(result);
  }
);
