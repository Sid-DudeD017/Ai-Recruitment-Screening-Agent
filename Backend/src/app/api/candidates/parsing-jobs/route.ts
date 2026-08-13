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

/**
 * POST /api/candidates/parsing-jobs
 * Creates multiple PENDING parsing jobs upfront
 */
export const POST = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER"] },
  async (req, { auth }) => {
    const { fileNames } = await req.json();
    
    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return successResponse([]);
    }

    const createdJobs = [];
    for (const fileName of fileNames) {
      const job = await prisma.parsingJob.create({
        data: {
          fileName,
          status: "PENDING",
          companyId: auth.companyId,
        }
      });
      createdJobs.push(job);
    }

    return successResponse(createdJobs, 201);
  }
);
