import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { prisma } from "@/infrastructure/database/prisma.client";
import { z } from "zod";
import { NotFoundError } from "@/shared/errors";

const rankSchema = z.object({
  jobId: z.string().min(1),
});

/**
 * POST /api/ai/rank
 * Rank all candidates for a job based on their resumes
 */
export const POST = routeHandler(
  {
    bodySchema: rankSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    // Get the job and its applications with candidate resumes
    const job = await prisma.job.findFirst({
      where: { id: body.jobId, companyId: auth.companyId },
      select: { requirements: true },
    });

    if (!job) {
      throw new NotFoundError("Job", body.jobId);
    }

    const applications = await prisma.application.findMany({
      where: { jobId: body.jobId },
      include: {
        candidate: {
          include: {
            resumes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { skills: true, rawText: true },
            },
          },
        },
      },
    });

    // Build the candidates array for the AI service
    const candidates = applications.map((app) => {
      const resume = app.candidate.resumes[0];
      return {
        candidateId: app.candidateId,
        skills: resume?.skills || [],
        experience: resume?.rawText || "",
        resumeSummary: resume?.rawText?.substring(0, 500) || "",
      };
    });

    const result = await aiClient.rank({
      jobId: body.jobId,
      candidates,
      jobRequirements: job.requirements || "",
    });

    return successResponse(result);
  }
);
