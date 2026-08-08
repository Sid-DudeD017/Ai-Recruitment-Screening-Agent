import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { prisma } from "@/infrastructure/database/prisma.client";

/**
 * GET /api/me
 * Get the current authenticated user's profile
 */
export const GET = routeHandler({}, async (_req, { auth }) => {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      company: {
        select: { id: true, name: true, domain: true, logo: true },
      },
    },
  });

  return successResponse(user);
});
