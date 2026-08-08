import { prisma } from "@/infrastructure/database/prisma.client";
import type { Prisma } from "@/generated/prisma/client";
import type { CandidateListFilters } from "./candidates.types";
import { getPrismaOffset } from "@/shared/utils/pagination";

// ============================================================================
// Candidates Repository
// ============================================================================

export const candidatesRepository = {
  async create(data: Prisma.CandidateCreateInput) {
    return prisma.candidate.create({
      data,
      include: {
        _count: { select: { applications: true, resumes: true } },
      },
    });
  },

  async findById(id: string, companyId: string) {
    return prisma.candidate.findFirst({
      where: { id, companyId },
      include: {
        resumes: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            skills: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        applications: {
          select: {
            id: true,
            jobId: true,
            status: true,
            matchScore: true,
            appliedAt: true,
          },
          orderBy: { appliedAt: "desc" },
        },
        _count: { select: { applications: true, resumes: true } },
      },
    });
  },

  async findByEmail(email: string, companyId: string) {
    return prisma.candidate.findFirst({
      where: { email, companyId },
    });
  },

  async findMany(filters: CandidateListFilters) {
    const { companyId, search, source, page, limit, sortBy, sortOrder } = filters;
    const { skip, take } = getPrismaOffset({ page, limit });

    const where: Prisma.CandidateWhereInput = {
      companyId,
      ...(source && { source }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { applications: true, resumes: true } },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, companyId: string, data: Prisma.CandidateUpdateInput) {
    return prisma.candidate.update({
      where: { id, companyId },
      data,
      include: {
        _count: { select: { applications: true, resumes: true } },
      },
    });
  },

  async delete(id: string, companyId: string) {
    return prisma.candidate.delete({
      where: { id, companyId },
    });
  },
};
