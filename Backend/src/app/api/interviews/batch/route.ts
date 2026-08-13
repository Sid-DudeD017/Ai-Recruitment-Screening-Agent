import { routeHandler } from "@/shared/utils/route-handler";
import { createdResponse } from "@/shared/utils/api-response";
import { interviewsService } from "@/modules/interviews/interviews.service";
import { createBatchInterviewSchema } from "@/modules/interviews/interviews.validator";

/**
 * POST /api/interviews/batch
 * Batch schedule interviews for multiple applications under a job role
 */
export const POST = routeHandler(
  {
    bodySchema: createBatchInterviewSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    const interviews = await interviewsService.createBatch(
      body,
      auth.companyId,
      auth.clerkId
    );
    return createdResponse(interviews);
  }
);
