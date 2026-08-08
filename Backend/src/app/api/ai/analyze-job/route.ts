import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { z } from "zod";

const analyzeJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
});

/**
 * POST /api/ai/analyze-job
 * Send job details to AI for analysis (skill extraction, market insights)
 */
export const POST = routeHandler(
  {
    bodySchema: analyzeJobSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { body }) => {
    const result = await aiClient.analyzeJob({
      title: body.title,
      description: body.description,
      requirements: body.requirements || "",
    });
    return successResponse(result);
  }
);
