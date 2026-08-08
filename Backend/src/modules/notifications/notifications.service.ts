import { prisma } from "@/infrastructure/database/prisma.client";
import type { NotificationType, Prisma } from "@/generated/prisma/client";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("notifications-service");

// ============================================================================
// Notifications Service
// ============================================================================

export const notificationsService = {
  /**
   * Create a notification for a user
   */
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const createData: Prisma.NotificationUncheckedCreateInput = {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
      };

      if (data.metadata !== undefined) {
        createData.metadata = data.metadata as Prisma.InputJsonValue;
      }

      return await prisma.notification.create({ data: createData });
    } catch (error) {
      // Notifications should never break the main flow
      logger.error({ error, ...data }, "Failed to create notification");
      return null;
    }
  },

  /**
   * Get notifications for the current user
   */
  async getForUser(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
  ) {
    const { unreadOnly = false, limit = 20, offset = 0 } = options;

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: {
          userId,
          ...(unreadOnly && { isRead: false }),
        },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { data, total, unreadCount };
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
