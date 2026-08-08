import { prisma } from "@/infrastructure/database/prisma.client";
import type { Prisma, ApplicationStatus } from "@/generated/prisma/client";
import type { ApplicationListFilters } from "./applications.types";
import { getPrismaOffset } from "@/shared/utils/pagination";
import { toJsonInput } from "@/infrastructure/database/prisma.helpers";

// ============================================================================
// Applications Repository
// ============================================================================

export const applicationsRepository = {
  async create(data: Prisma.ApplicationCreateInput) {
    return prisma.application.create({
      data,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: { select: { id: true, title: true, status: true } },
      },
    });
  },

  async findById(id: string, companyId: string) {
    return prisma.application.findFirst({
      where: {
        id,
        job: { companyId },
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: { select: { id: true, title: true, status: true } },
        interviews: {
          select: { id: true, scheduledAt: true, status: true, type: true },
          orderBy: { scheduledAt: "desc" },
        },
      },
    });
  },

  async findByUnique(candidateId: string, jobId: string) {
    return prisma.application.findUnique({
      where: {
        candidateId_jobId: { candidateId, jobId },
      },
    });
  },

  async findMany(filters: ApplicationListFilters) {
    const {
      companyId,
      jobId,
      candidateId,
      status,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;
    const { skip, take } = getPrismaOffset({ page, limit });

    const where: Prisma.ApplicationWhereInput = {
      job: { companyId },
      ...(jobId && { jobId }),
      ...(candidateId && { candidateId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          {
            candidate: {
              firstName: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            candidate: {
              lastName: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            candidate: {
              email: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          job: { select: { id: true, title: true, status: true } },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return { data, total };
  },

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    data?: { notes?: string; matchScore?: number; aiAnalysis?: Record<string, unknown> | null }
  ) {
    const { aiAnalysis, ...rest } = data || {};
    return prisma.application.update({
      where: { id },
      data: {
        status,
        ...rest,
        ...(aiAnalysis !== undefined && { aiAnalysis: toJsonInput(aiAnalysis ?? undefined) }),
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: { select: { id: true, title: true, status: true } },
      },
    });
  },

  async countByStatusForJob(jobId: string) {
    return prisma.application.groupBy({
      by: ["status"],
      where: { jobId },
      _count: true,
    });
  },

  async countByStatusForCompany(companyId: string) {
    return prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId } },
      _count: true,
    });
  },
};
