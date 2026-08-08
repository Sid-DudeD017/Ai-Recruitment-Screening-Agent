import type { Job, JobStatus, JobType } from "@/generated/prisma/client";

// ============================================================================
// Job DTOs — decouple domain from Prisma types
// ============================================================================

export interface JobDto {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  type: JobType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  status: JobStatus;
  companyId: string;
  createdById: string;
  aiAnalysis: unknown;
  publishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    applications: number;
  };
}

export interface JobWithRelations extends JobDto {
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface JobListFilters {
  companyId: string;
  status?: JobStatus;
  type?: JobType;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

/**
 * Convert a Prisma Job model to a DTO
 */
export function toJobDto(job: Job & { _count?: { applications: number } }): JobDto {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    location: job.location,
    type: job.type,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    status: job.status,
    companyId: job.companyId,
    createdById: job.createdById,
    aiAnalysis: job.aiAnalysis,
    publishedAt: job.publishedAt,
    closedAt: job.closedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    _count: job._count,
  };
}
