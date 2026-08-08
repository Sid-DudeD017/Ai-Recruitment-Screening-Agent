import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse, createdResponse } from "@/shared/utils/api-response";
import { applicationsService } from "@/modules/applications/applications.service";
import {
  createApplicationSchema,
  applicationFilterSchema,
} from "@/modules/applications/applications.validator";

/**
 * GET /api/applications
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth }) => {
    const sp = req.nextUrl.searchParams;
    const filters = applicationFilterSchema.parse({
      jobId: sp.get("jobId") ?? undefined,
      candidateId: sp.get("candidateId") ?? undefined,
      status: sp.get("status") ?? undefined,
      search: sp.get("search") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      sortBy: sp.get("sortBy") ?? undefined,
      sortOrder: sp.get("sortOrder") ?? undefined,
    });

    const result = await applicationsService.list(filters, auth.companyId);
    return successResponse(result.data, 200, result.meta);
  }
);

/**
 * POST /api/applications
 */
export const POST = routeHandler(
  {
    bodySchema: createApplicationSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    const application = await applicationsService.create(body, auth.companyId);
    return createdResponse(application);
  }
);
