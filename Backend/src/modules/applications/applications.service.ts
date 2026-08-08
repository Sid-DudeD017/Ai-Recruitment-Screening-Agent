import { applicationsRepository } from "./applications.repository";
import { toApplicationDto } from "./applications.types";
import type {
  CreateApplicationInput,
  UpdateApplicationStatusInput,
  ApplicationFilterInput,
} from "./applications.validator";
import { NotFoundError, AppError } from "@/shared/errors";
import { isValidTransition } from "@/shared/constants";
import { buildPaginatedResult } from "@/shared/utils/pagination";
import { cacheService } from "@/infrastructure/cache/cache.service";
import { CacheKeys } from "@/infrastructure/cache/cache.keys";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("applications-service");

// ============================================================================
// Applications Service — enforces the application state machine
// ============================================================================

export const applicationsService = {
  /**
   * Apply a candidate to a job
   */
  async create(input: CreateApplicationInput, companyId: string) {
    // Check if application already exists
    const existing = await applicationsRepository.findByUnique(
      input.candidateId,
      input.jobId
    );
    if (existing) {
      throw new AppError(
        "This candidate has already applied to this job",
        409,
        "DUPLICATE_APPLICATION"
      );
    }

    const application = await applicationsRepository.create({
      candidate: { connect: { id: input.candidateId } },
      job: { connect: { id: input.jobId } },
      notes: input.notes,
      status: "APPLIED",
    });

    // Invalidate related caches
    await Promise.all([
      cacheService.del(CacheKeys.applicationsList(companyId)),
      cacheService.del(CacheKeys.applicationsByJob(companyId, input.jobId)),
      cacheService.del(CacheKeys.dashboardStats(companyId)),
    ]);

    logger.info(
      { applicationId: application.id, candidateId: input.candidateId, jobId: input.jobId },
      "Application created"
    );
    return application;
  },

  /**
   * Get a single application by ID
   */
  async getById(id: string, companyId: string) {
    const application = await applicationsRepository.findById(id, companyId);
    if (!application) {
      throw new NotFoundError("Application", id);
    }
    return application;
  },

  /**
   * List applications with filters
   */
  async list(filters: ApplicationFilterInput, companyId: string) {
    const { data, total } = await applicationsRepository.findMany({
      ...filters,
      companyId,
    });

    return buildPaginatedResult(data.map(toApplicationDto), total, {
      page: filters.page,
      limit: filters.limit,
    });
  },

  /**
   * Transition to SCREENING status
   */
  async screen(id: string, input: UpdateApplicationStatusInput, companyId: string) {
    return this._transition(id, "SCREENING", companyId, input);
  },

  /**
   * Shortlist an application
   */
  async shortlist(id: string, input: UpdateApplicationStatusInput, companyId: string) {
    return this._transition(id, "SHORTLISTED", companyId, input);
  },

  /**
   * Reject an application
   */
  async reject(id: string, input: UpdateApplicationStatusInput, companyId: string) {
    return this._transition(id, "REJECTED", companyId, input);
  },

  /**
   * Mark as hired
   */
  async hire(id: string, input: UpdateApplicationStatusInput, companyId: string) {
    return this._transition(id, "HIRED", companyId, input);
  },

  /**
   * Move to interview stage
   */
  async moveToInterview(
    id: string,
    input: UpdateApplicationStatusInput,
    companyId: string
  ) {
    return this._transition(id, "INTERVIEW", companyId, input);
  },

  /**
   * Move to offered stage
   */
  async offer(id: string, input: UpdateApplicationStatusInput, companyId: string) {
    return this._transition(id, "OFFERED", companyId, input);
  },

  /**
   * Core state transition — validates the transition is allowed
   */
  async _transition(
    id: string,
    targetStatus: string,
    companyId: string,
    input?: UpdateApplicationStatusInput
  ) {
    const application = await applicationsRepository.findById(id, companyId);
    if (!application) {
      throw new NotFoundError("Application", id);
    }

    const currentStatus = application.status;

    if (!isValidTransition(currentStatus, targetStatus)) {
      throw new AppError(
        `Cannot transition application from '${currentStatus}' to '${targetStatus}'`,
        400,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const updated = await applicationsRepository.updateStatus(
      id,
      targetStatus as Parameters<typeof applicationsRepository.updateStatus>[1],
      { notes: input?.notes }
    );

    // Invalidate caches
    await Promise.all([
      cacheService.del(CacheKeys.applicationsList(companyId)),
      cacheService.del(
        CacheKeys.applicationsByJob(companyId, application.jobId)
      ),
      cacheService.del(CacheKeys.dashboardStats(companyId)),
      cacheService.del(CacheKeys.dashboardPipeline(companyId)),
    ]);

    logger.info(
      {
        applicationId: id,
        from: currentStatus,
        to: targetStatus,
        companyId,
      },
      "Application status transitioned"
    );

    return updated;
  },
};
