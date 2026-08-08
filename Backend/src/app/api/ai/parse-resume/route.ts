import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { prisma } from "@/infrastructure/database/prisma.client";
import { z } from "zod";
import { NotFoundError } from "@/shared/errors";
import { toJsonInput } from "@/infrastructure/database/prisma.helpers";

const parseResumeSchema = z.object({
  candidateId: z.string().min(1),
  resumeId: z.string().min(1),
});

/**
 * POST /api/ai/parse-resume
 * Sends a resume to the AI service for parsing and stores the result
 */
export const POST = routeHandler(
  {
    bodySchema: parseResumeSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    // Get the resume
    const resume = await prisma.resume.findFirst({
      where: {
        id: body.resumeId,
        candidateId: body.candidateId,
        candidate: { companyId: auth.companyId },
      },
    });

    if (!resume) {
      throw new NotFoundError("Resume", body.resumeId);
    }

    // Call teammate's AI service
    const result = await aiClient.parseResume({
      fileUrl: resume.fileUrl,
      fileName: resume.fileName,
    });

    // Store parsed data back on the resume
    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        parsedContent: toJsonInput(result as unknown as Record<string, unknown>),
        skills: result.skills,
        rawText: result.parsedContent,
      },
    });

    return successResponse(result);
  }
);
