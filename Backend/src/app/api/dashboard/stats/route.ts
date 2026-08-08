import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { dashboardService } from "@/modules/dashboard/dashboard.service";

/**
 * GET /api/dashboard/stats
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (_req, { auth }) => {
    const stats = await dashboardService.getStats(auth.companyId);
    return successResponse(stats);
  }
);
