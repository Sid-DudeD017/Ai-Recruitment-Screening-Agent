import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { applicationsService } from "@/modules/applications/applications.service";

/**
 * GET /api/applications/:id
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (_req, { auth, params }) => {
    const application = await applicationsService.getById(
      params.id,
      auth.companyId
    );
    return successResponse(application);
  }
);
