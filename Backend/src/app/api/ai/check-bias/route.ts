import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { z } from "zod";

const checkBiasSchema = z.object({
  jobTitle: z.string().min(1),
  jobDescription: z.string().min(1),
  requirements: z.string().default(""),
});

/**
 * POST /api/ai/check-bias
 * Check a job description for biased or exclusionary language
 */
export const POST = routeHandler(
  {
    bodySchema: checkBiasSchema,
    allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"],
  },
  async (_req, { body }) => {
    const result = await aiClient.checkBias({
      jobTitle: body.jobTitle,
      jobDescription: body.jobDescription,
      requirements: body.requirements,
    });
    return successResponse(result);
  }
);
