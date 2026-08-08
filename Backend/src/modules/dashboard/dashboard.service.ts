import { prisma } from "@/infrastructure/database/prisma.client";
import { cacheService } from "@/infrastructure/cache/cache.service";
import { CacheKeys } from "@/infrastructure/cache/cache.keys";
import { APP_CONSTANTS } from "@/config";
import { auditService } from "@/modules/audit/audit.service";
import { interviewsRepository } from "@/modules/interviews/interviews.repository";

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  jobs: { total: number; open: number; closed: number; draft: number };
  candidates: { total: number };
  applications: { total: number; thisMonth: number };
  interviews: { upcoming: number };
  hired: { thisMonth: number };
}

export interface PipelineData {
  status: string;
  count: number;
}

// ============================================================================
// Dashboard Service
// ============================================================================

export const dashboardService = {
  /**
   * GET /api/dashboard/stats — aggregated overview
   */
  async getStats(companyId: string): Promise<DashboardStats> {
    return cacheService.getOrSet(
      CacheKeys.dashboardStats(companyId),
      APP_CONSTANTS.CACHE_TTL_MEDIUM,
      async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
          jobCounts,
          totalCandidates,
          totalApplications,
          applicationsThisMonth,
          upcomingInterviews,
          hiredThisMonth,
        ] = await Promise.all([
          prisma.job.groupBy({
            by: ["status"],
            where: { companyId },
            _count: true,
          }),
          prisma.candidate.count({ where: { companyId } }),
          prisma.application.count({
            where: { job: { companyId } },
          }),
          prisma.application.count({
            where: {
              job: { companyId },
              appliedAt: { gte: startOfMonth },
            },
          }),
          interviewsRepository.countUpcoming(companyId),
          prisma.application.count({
            where: {
              job: { companyId },
              status: "HIRED",
              updatedAt: { gte: startOfMonth },
            },
          }),
        ]);

        const jobsByStatus = Object.fromEntries(
          jobCounts.map((j) => [j.status.toLowerCase(), j._count])
        );

        return {
          jobs: {
            total: jobCounts.reduce((sum, j) => sum + j._count, 0),
            open: jobsByStatus["open"] || 0,
            closed: jobsByStatus["closed"] || 0,
            draft: jobsByStatus["draft"] || 0,
          },
          candidates: { total: totalCandidates },
          applications: {
            total: totalApplications,
            thisMonth: applicationsThisMonth,
          },
          interviews: { upcoming: upcomingInterviews },
          hired: { thisMonth: hiredThisMonth },
        };
      }
    );
  },

  /**
   * GET /api/dashboard/pipeline — application funnel by status
   */
  async getPipeline(
    companyId: string,
    jobId?: string
  ): Promise<PipelineData[]> {
    return cacheService.getOrSet(
      CacheKeys.dashboardPipeline(companyId),
      APP_CONSTANTS.CACHE_TTL_MEDIUM,
      async () => {
        const where = jobId
          ? { jobId, job: { companyId } }
          : { job: { companyId } };

        const counts = await prisma.application.groupBy({
          by: ["status"],
          where,
          _count: true,
        });

        // Return in pipeline order
        const statusOrder = [
          "APPLIED",
          "SCREENING",
          "SHORTLISTED",
          "INTERVIEW",
          "OFFERED",
          "HIRED",
          "REJECTED",
        ];

        return statusOrder.map((status) => ({
          status,
          count: counts.find((c) => c.status === status)?._count || 0,
        }));
      }
    );
  },

  /**
   * GET /api/dashboard/activity — recent audit log activity
   */
  async getActivity(companyId: string) {
    return auditService.getRecentActivity(companyId, 50);
  },
};
