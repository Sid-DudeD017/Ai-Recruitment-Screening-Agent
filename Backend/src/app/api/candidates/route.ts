import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse, createdResponse } from "@/shared/utils/api-response";
import { candidatesService } from "@/modules/candidates/candidates.service";
import {
  createCandidateSchema,
  candidateFilterSchema,
} from "@/modules/candidates/candidates.validator";

/**
 * GET /api/candidates
 */
export const GET = routeHandler(
  { allowedRoles: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] },
  async (req, { auth }) => {
    const sp = req.nextUrl.searchParams;
    const filters = candidateFilterSchema.parse({
      search: sp.get("search") ?? undefined,
      source: sp.get("source") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      sortBy: sp.get("sortBy") ?? undefined,
      sortOrder: sp.get("sortOrder") ?? undefined,
    });

    const result = await candidatesService.list(filters, auth.companyId);
    return successResponse(result.data, 200, result.meta);
  }
);

/**
 * POST /api/candidates
 */
export const POST = routeHandler(
  {
    bodySchema: createCandidateSchema,
    allowedRoles: ["ADMIN", "RECRUITER"],
  },
  async (_req, { auth, body }) => {
    const candidate = await candidatesService.create(body, auth.companyId);
    return createdResponse(candidate);
  }
);
