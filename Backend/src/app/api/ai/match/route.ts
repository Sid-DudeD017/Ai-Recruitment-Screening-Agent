import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { prisma } from "@/infrastructure/database/prisma.client";
import { z } from "zod";
import { NotFoundError } from "@/shared/errors";
import { toJsonInput } from "@/infrastructure/database/prisma.helpers";

const matchSchema = z.object({
  applicationId: z.string().min(1),
});

/**
 * POST /api/ai/match
 * Match a candidate's resume against a job and store the score
 */
export const POST = routeHandler(
  {
    bodySchema: matchSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    const application = await prisma.application.findFirst({
      where: { id: body.applicationId, job: { companyId: auth.companyId } },
      include: {
        candidate: {
          include: {
            resumes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { parsedContent: true, skills: true, rawText: true },
            },
          },
        },
        job: { select: { title: true, description: true, requirements: true } },
      },
    });

    if (!application) {
      throw new NotFoundError("Application", body.applicationId);
    }

    const resume = application.candidate.resumes[0];
    if (!resume) {
      return successResponse({
        error: "No resume found for this candidate. Upload a resume first.",
      });
    }

    // Call teammate's AI match endpoint with the correct types
    const result = await aiClient.match({
      candidateSkills: resume.skills,
      candidateExperience: resume.rawText || "",
      jobRequirements: application.job.requirements || "",
      jobDescription: application.job.description,
    });

    // Store the match score on the application
    await prisma.application.update({
      where: { id: body.applicationId },
      data: {
        matchScore: result.matchScore,
        aiAnalysis: toJsonInput(result as unknown as Record<string, unknown>),
      },
    });

    return successResponse(result);
  }
);
