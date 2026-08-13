import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { prisma } from "@/infrastructure/database/prisma.client";

/**
 * GET /api/candidates/parsing-jobs
 * Fetches the recent parsing jobs for the company
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth }) => {
    const jobs = await prisma.parsingJob.findMany({
      where: {
        companyId: auth.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to most recent 50
    });

    return successResponse(jobs);
  }
);
