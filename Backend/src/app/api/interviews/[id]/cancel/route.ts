import { routeHandler } from "@/shared/utils/route-handler";
import { noContentResponse } from "@/shared/utils/api-response";
import { interviewsService } from "@/modules/interviews/interviews.service";

/**
 * PATCH /api/interviews/:id/cancel
 */
export const PATCH = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER"] },
  async (_req, { auth, params }) => {
    await interviewsService.cancel(params.id, auth.companyId, auth.clerkId);
    return noContentResponse();
  }
);
