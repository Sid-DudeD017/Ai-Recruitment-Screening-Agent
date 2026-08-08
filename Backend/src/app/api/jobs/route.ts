import { NextRequest } from "next/server";
import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse, createdResponse } from "@/shared/utils/api-response";
import { jobsService } from "@/modules/jobs/jobs.service";
import { createJobSchema, jobFilterSchema } from "@/modules/jobs/jobs.validator";

/**
 * GET /api/jobs
 * List jobs with filters and pagination
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth }) => {
    const searchParams = req.nextUrl.searchParams;
    const filters = jobFilterSchema.parse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    });

    const result = await jobsService.list(filters, auth.companyId);
    return successResponse(result.data, 200, result.meta);
  }
);

/**
 * POST /api/jobs
 * Create a new job posting
 */
export const POST = routeHandler(
  {
    bodySchema: createJobSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    const job = await jobsService.create(body, auth.userId, auth.companyId);
    return createdResponse(job);
  }
);
