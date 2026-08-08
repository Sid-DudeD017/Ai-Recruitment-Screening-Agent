import { prisma } from "@/infrastructure/database/prisma.client";
import type { Prisma } from "@/generated/prisma/client";

// ============================================================================
// Audit Repository
// ============================================================================

export const auditRepository = {
  async create(data: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const createData: Prisma.AuditLogUncheckedCreateInput = {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    if (data.changes !== undefined) {
      createData.changes = data.changes as Prisma.InputJsonValue;
    }

    return prisma.auditLog.create({ data: createData });
  },

  async findMany(
    companyId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    return prisma.auditLog.findMany({
      where: { user: { companyId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  },
};
