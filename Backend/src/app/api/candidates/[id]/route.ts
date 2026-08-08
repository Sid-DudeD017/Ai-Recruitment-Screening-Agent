import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse, noContentResponse } from "@/shared/utils/api-response";
import { candidatesService } from "@/modules/candidates/candidates.service";
import { updateCandidateSchema } from "@/modules/candidates/candidates.validator";

/**
 * GET /api/candidates/:id
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (_req, { auth, params }) => {
    const candidate = await candidatesService.getById(params.id, auth.companyId);
    return successResponse(candidate);
  }
);

/**
 * PUT /api/candidates/:id
 */
export const PUT = routeHandler(
  {
    bodySchema: updateCandidateSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body, params }) => {
    const candidate = await candidatesService.update(
      params.id,
      body,
      auth.companyId
    );
    return successResponse(candidate);
  }
);

/**
 * DELETE /api/candidates/:id
 */
export const DELETE = routeHandler(
  { allowedRoles: ["ADMIN"] },
  async (_req, { auth, params }) => {
    await candidatesService.delete(params.id, auth.companyId);
    return noContentResponse();
  }
);
