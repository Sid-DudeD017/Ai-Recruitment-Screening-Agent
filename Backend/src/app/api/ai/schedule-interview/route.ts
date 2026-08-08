import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { aiClient } from "@/infrastructure/ai/ai-client";
import { z } from "zod";

const scheduleSchema = z.object({
  interviewerAvailability: z.array(z.string()).min(1),
  candidatePreferences: z.array(z.string()).optional(),
  durationMinutes: z.number().int().min(15).max(240).default(60),
  timezone: z.string().default("UTC"),
});

/**
 * POST /api/ai/schedule-interview
 * Uses AI to find optimal interview time slots based on availability and preferences
 */
export const POST = routeHandler(
  {
    bodySchema: scheduleSchema,
    allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"],
  },
  async (_req, { body }) => {
    const result = await aiClient.scheduleInterview({
      interviewerAvailability: body.interviewerAvailability,
      candidatePreferences: body.candidatePreferences,
      durationMinutes: body.durationMinutes,
      timezone: body.timezone,
    });
    return successResponse(result);
  }
);
