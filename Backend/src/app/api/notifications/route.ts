import { NextRequest } from "next/server";
import { routeHandler } from "@/shared/utils/route-handler";
import { successResponse } from "@/shared/utils/api-response";
import { notificationsService } from "@/modules/notifications/notifications.service";

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export const GET = routeHandler({}, async (req: NextRequest, { auth }) => {
  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get("unreadOnly") === "true";
  const limit = parseInt(sp.get("limit") || "20", 10);
  const offset = parseInt(sp.get("offset") || "0", 10);

  const result = await notificationsService.getForUser(auth.userId, {
    unreadOnly,
    limit,
    offset,
  });
  return successResponse(result);
});

/**
 * PATCH /api/notifications
 * Mark all notifications as read
 */
export const PATCH = routeHandler({}, async (_req, { auth }) => {
  await notificationsService.markAllAsRead(auth.userId);
  return successResponse({ message: "All notifications marked as read" });
});
