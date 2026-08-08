import { auditRepository } from "./audit.repository";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("audit-service");

// ============================================================================
// Audit Service — logs all mutations for compliance and debugging
// ============================================================================

export const auditService = {
  /**
   * Log an action. Fire-and-forget — does not throw on failure.
   */
  async log(data: {
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
    entity: string;
    entityId: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await auditRepository.create(data);
    } catch (error) {
      // Audit logging should never break the main flow
      logger.error({ error, ...data }, "Failed to create audit log");
    }
  },

  /**
   * Get recent activity for a company (dashboard)
   */
  async getRecentActivity(companyId: string, limit: number = 50) {
    return auditRepository.findMany(companyId, { limit });
  },
};
