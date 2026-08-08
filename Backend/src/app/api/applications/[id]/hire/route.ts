import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { applicationsService } from "@/modules/applications/applications.service";
import { updateApplicationStatusSchema } from "@/modules/applications/applications.validator";

/**
 * PATCH /api/applications/:id/hire
 */
export const PATCH = routeHandler(
  {
    bodySchema: updateApplicationStatusSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body, params }) => {
    const application = await applicationsService.hire(
      params.id,
      body,
      auth.companyId
    );
    return successResponse(application);
  }
);
