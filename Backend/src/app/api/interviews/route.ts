import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse, createdResponse } from "@/shared/utils/api-response";
import { interviewsService } from "@/modules/interviews/interviews.service";
import {
  createInterviewSchema,
  interviewFilterSchema,
} from "@/modules/interviews/interviews.validator";

/**
 * GET /api/interviews
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth }) => {
    const sp = req.nextUrl.searchParams;
    const filters = interviewFilterSchema.parse({
      applicationId: sp.get("applicationId") ?? undefined,
      status: sp.get("status") ?? undefined,
      fromDate: sp.get("fromDate") ?? undefined,
      toDate: sp.get("toDate") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      sortBy: sp.get("sortBy") ?? undefined,
      sortOrder: sp.get("sortOrder") ?? undefined,
    });

    const result = await interviewsService.list(filters, auth.companyId);
    return successResponse(result.data, 200, result.meta);
  }
);

/**
 * POST /api/interviews
 */
export const POST = routeHandler(
  {
    bodySchema: createInterviewSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    const interview = await interviewsService.create(body, auth.companyId, auth.clerkId);
    return createdResponse(interview);
  }
);
