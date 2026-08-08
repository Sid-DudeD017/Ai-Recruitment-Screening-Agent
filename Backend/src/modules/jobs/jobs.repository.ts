import { prisma } from "@/infrastructure/database/prisma.client";
import type { Prisma } from "@/generated/prisma/client";
import type { JobListFilters } from "./jobs.types";
import { getPrismaOffset } from "@/shared/utils/pagination";

// ============================================================================
// Jobs Repository — all database operations for the Job entity
// ============================================================================

export const jobsRepository = {
  /**
   * Create a new job
   */
  async create(data: Prisma.JobCreateInput) {
    return prisma.job.create({
      data,
      include: {
        _count: { select: { applications: true } },
      },
    });
  },

  /**
   * Find a job by ID within a company (tenant isolation)
   */
  async findById(id: string, companyId: string) {
    return prisma.job.findFirst({
      where: { id, companyId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { applications: true } },
      },
    });
  },

  /**
   * List jobs with filters, search, and pagination
   */
  async findMany(filters: JobListFilters) {
    const { companyId, status, type, search, page, limit, sortBy, sortOrder } =
      filters;
    const { skip, take } = getPrismaOffset({ page, limit });

    const where: Prisma.JobWhereInput = {
      companyId,
      ...(status && { status }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { location: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return { data, total };
  },

  /**
   * Update a job by ID within a company
   */
  async update(id: string, companyId: string, data: Prisma.JobUpdateInput) {
    return prisma.job.update({
      where: { id, companyId },
      data,
      include: {
        _count: { select: { applications: true } },
      },
    });
  },

  /**
   * Soft-delete a job (archive it)
   */
  async archive(id: string, companyId: string) {
    return prisma.job.update({
      where: { id, companyId },
      data: { status: "ARCHIVED", closedAt: new Date() },
    });
  },

  /**
   * Count jobs by status for a company (dashboard)
   */
  async countByStatus(companyId: string) {
    return prisma.job.groupBy({
      by: ["status"],
      where: { companyId },
      _count: true,
    });
  },
};
