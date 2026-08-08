import { jobsRepository } from "./jobs.repository";
import { toJobDto } from "./jobs.types";
import type { CreateJobInput, UpdateJobInput, JobFilterInput } from "./jobs.validator";
import { NotFoundError, ForbiddenError, AppError } from "@/shared/errors";
import { buildPaginatedResult } from "@/shared/utils/pagination";
import { cacheService } from "@/infrastructure/cache/cache.service";
import { CacheKeys } from "@/infrastructure/cache/cache.keys";
import { APP_CONSTANTS } from "@/config";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("jobs-service");

// ============================================================================
// Jobs Service — business logic for job operations
// ============================================================================

export const jobsService = {
  /**
   * Create a new job posting
   */
  async create(input: CreateJobInput, userId: string, companyId: string) {
    const job = await jobsRepository.create({
      title: input.title,
      description: input.description,
      requirements: input.requirements,
      location: input.location,
      type: input.type,
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      currency: input.currency,
      company: { connect: { id: companyId } },
      createdBy: { connect: { id: userId } },
    });

    // Invalidate list cache
    await cacheService.del(CacheKeys.jobsList(companyId));

    logger.info({ jobId: job.id, companyId }, "Job created");
    return toJobDto(job);
  },

  /**
   * Get a single job by ID
   */
  async getById(id: string, companyId: string) {
    const job = await cacheService.getOrSet(
      CacheKeys.jobDetail(companyId, id),
      APP_CONSTANTS.CACHE_TTL_MEDIUM,
      () => jobsRepository.findById(id, companyId)
    );

    if (!job) {
      throw new NotFoundError("Job", id);
    }

    return job;
  },

  /**
   * List jobs with filters and pagination
   */
  async list(filters: JobFilterInput, companyId: string) {
    const { data, total } = await jobsRepository.findMany({
      ...filters,
      companyId,
    });

    return buildPaginatedResult(data.map(toJobDto), total, {
      page: filters.page,
      limit: filters.limit,
    });
  },

  /**
   * Update a job
   */
  async update(
    id: string,
    input: UpdateJobInput,
    userId: string,
    companyId: string,
    userRole: string
  ) {
    const existing = await jobsRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Job", id);
    }

    // Only the creator or ADMIN can update
    if (existing.createdById !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Only the job creator or an admin can update this job");
    }

    // Handle status transitions
    const updateData: Record<string, unknown> = { ...input };
    if (input.status === "OPEN" && existing.status === "DRAFT") {
      updateData.publishedAt = new Date();
    } else if (input.status === "CLOSED" && existing.status === "OPEN") {
      updateData.closedAt = new Date();
    } else if (input.status && input.status !== existing.status) {
      // Validate the transition makes sense
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["OPEN", "ARCHIVED"],
        OPEN: ["CLOSED", "ARCHIVED"],
        CLOSED: ["OPEN", "ARCHIVED"],
        ARCHIVED: [],
      };
      if (!validTransitions[existing.status]?.includes(input.status)) {
        throw new AppError(
          `Cannot transition job from ${existing.status} to ${input.status}`,
          400,
          "INVALID_STATUS_TRANSITION"
        );
      }
    }

    const updated = await jobsRepository.update(id, companyId, updateData);

    // Invalidate caches
    await Promise.all([
      cacheService.del(CacheKeys.jobDetail(companyId, id)),
      cacheService.del(CacheKeys.jobsList(companyId)),
    ]);

    logger.info({ jobId: id, companyId }, "Job updated");
    return toJobDto(updated);
  },

  /**
   * Delete (archive) a job — only ADMIN can do this
   */
  async delete(id: string, companyId: string) {
    const existing = await jobsRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Job", id);
    }

    await jobsRepository.archive(id, companyId);

    // Invalidate caches
    await Promise.all([
      cacheService.del(CacheKeys.jobDetail(companyId, id)),
      cacheService.del(CacheKeys.jobsList(companyId)),
    ]);

    logger.info({ jobId: id, companyId }, "Job archived");
  },
};
