import { prisma } from "@/infrastructure/database/prisma.client";
import type { Prisma, InterviewStatus } from "@/generated/prisma/client";
import type { InterviewListFilters } from "./interviews.types";
import { getPrismaOffset } from "@/shared/utils/pagination";

// ============================================================================
// Interviews Repository
// ============================================================================

export const interviewsRepository = {
  async create(data: Prisma.InterviewCreateInput) {
    return prisma.interview.create({
      data,
      include: {
        application: {
          select: {
            id: true,
            status: true,
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            job: { select: { id: true, title: true } },
          },
        },
      },
    });
  },

  async findById(id: string, companyId: string) {
    return prisma.interview.findFirst({
      where: {
        id,
        application: { job: { companyId } },
      },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            job: { select: { id: true, title: true } },
          },
        },
      },
    });
  },

  async findMany(filters: InterviewListFilters) {
    const {
      companyId,
      applicationId,
      status,
      fromDate,
      toDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;
    const { skip, take } = getPrismaOffset({ page, limit });

    const where: Prisma.InterviewWhereInput = {
      application: { job: { companyId } },
      ...(applicationId && { applicationId }),
      ...(status && { status }),
      ...(fromDate || toDate
        ? {
            scheduledAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          application: {
            select: {
              id: true,
              status: true,
              candidate: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              job: { select: { id: true, title: true } },
            },
          },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.InterviewUpdateInput) {
    return prisma.interview.update({
      where: { id },
      data,
      include: {
        application: {
          select: {
            id: true,
            status: true,
            candidate: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            job: { select: { id: true, title: true } },
          },
        },
      },
    });
  },

  async updateStatus(id: string, status: InterviewStatus) {
    return prisma.interview.update({
      where: { id },
      data: { status },
    });
  },

  async countUpcoming(companyId: string, days: number = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return prisma.interview.count({
      where: {
        application: { job: { companyId } },
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: future },
      },
    });
  },
};
