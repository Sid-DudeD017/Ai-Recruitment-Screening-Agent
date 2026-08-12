import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { applicationsService } from "@/modules/applications/applications.service";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    "APPLIED",
    "SCREENING",
    "PENDING_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFERED",
    "HIRED",
    "REJECTED"
  ]),
  notes: z.string().optional()
});

/**
 * PATCH /api/applications/:id/status
 */
export const PATCH = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth, params }) => {
    const body = await req.json();
    const data = updateStatusSchema.parse(body);

    const updated = await applicationsService._transition(
      params.id,
      data.status,
      auth.companyId,
      { notes: data.notes }
    );

    return successResponse(updated);
  }
);
