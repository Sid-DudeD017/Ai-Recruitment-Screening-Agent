import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse, noContentResponse } from "@/shared/utils/api-response";
import { jobsService } from "@/modules/jobs/jobs.service";
import { updateJobSchema } from "@/modules/jobs/jobs.validator";

/**
 * GET /api/jobs/:id
 * Get a single job by ID
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (_req, { auth, params }) => {
    const job = await jobsService.getById(params.id, auth.companyId);
    return successResponse(job);
  }
);

/**
 * PUT /api/jobs/:id
 * Update a job
 */
export const PUT = routeHandler(
  {
    bodySchema: updateJobSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body, params }) => {
    const job = await jobsService.update(
      params.id,
      body,
      auth.userId,
      auth.companyId,
      auth.role
    );
    return successResponse(job);
  }
);

/**
 * DELETE /api/jobs/:id
 * Archive a job (soft-delete)
 */
export const DELETE = routeHandler(
  { allowedRoles: ["ADMIN"] },
  async (_req, { auth, params }) => {
    await jobsService.delete(params.id, auth.companyId);
    return noContentResponse();
  }
);
