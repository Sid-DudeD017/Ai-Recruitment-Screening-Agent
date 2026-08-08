import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { dashboardService } from "@/modules/dashboard/dashboard.service";

/**
 * GET /api/dashboard/pipeline?jobId=optional
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth }) => {
    const jobId = req.nextUrl.searchParams.get("jobId") ?? undefined;
    const pipeline = await dashboardService.getPipeline(auth.companyId, jobId);
    return successResponse(pipeline);
  }
);
