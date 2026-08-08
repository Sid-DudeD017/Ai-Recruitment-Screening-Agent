import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { applicationsService } from "@/modules/applications/applications.service";
import { updateApplicationStatusSchema } from "@/modules/applications/applications.validator";

/**
 * PATCH /api/applications/:id/reject
 */
export const PATCH = routeHandler(
  {
    bodySchema: updateApplicationStatusSchema,
    allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"],
  },
  async (_req, { auth, body, params }) => {
    const application = await applicationsService.reject(
      params.id,
      body,
      auth.companyId
    );
    return successResponse(application);
  }
);
