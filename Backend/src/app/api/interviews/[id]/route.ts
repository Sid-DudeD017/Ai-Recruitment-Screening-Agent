import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { interviewsService } from "@/modules/interviews/interviews.service";
import { updateInterviewSchema } from "@/modules/interviews/interviews.validator";

/**
 * GET /api/interviews/:id
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (_req, { auth, params }) => {
    const interview = await interviewsService.getById(params.id, auth.companyId);
    return successResponse(interview);
  }
);

/**
 * PUT /api/interviews/:id
 */
export const PUT = routeHandler(
  {
    bodySchema: updateInterviewSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body, params }) => {
    const interview = await interviewsService.update(
      params.id,
      body,
      auth.companyId
    );
    return successResponse(interview);
  }
);
