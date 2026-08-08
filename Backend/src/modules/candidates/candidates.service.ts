import { candidatesRepository } from "./candidates.repository";
import { toCandidateDto } from "./candidates.types";
import type {
  CreateCandidateInput,
  UpdateCandidateInput,
  CandidateFilterInput,
} from "./candidates.validator";
import { NotFoundError, AppError } from "@/shared/errors";
import { buildPaginatedResult } from "@/shared/utils/pagination";
import { cacheService } from "@/infrastructure/cache/cache.service";
import { CacheKeys } from "@/infrastructure/cache/cache.keys";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("candidates-service");

// ============================================================================
// Candidates Service
// ============================================================================

export const candidatesService = {
  async create(input: CreateCandidateInput, companyId: string) {
    // Check for duplicate email within the company
    const existing = await candidatesRepository.findByEmail(
      input.email,
      companyId
    );
    if (existing) {
      throw new AppError(
        `A candidate with email '${input.email}' already exists`,
        409,
        "DUPLICATE_CANDIDATE"
      );
    }

    const candidate = await candidatesRepository.create({
      ...input,
      linkedinUrl: input.linkedinUrl || null,
      company: { connect: { id: companyId } },
    });

    await cacheService.del(CacheKeys.candidatesList(companyId));

    logger.info({ candidateId: candidate.id, companyId }, "Candidate created");
    return toCandidateDto(candidate);
  },

  async getById(id: string, companyId: string) {
    const candidate = await candidatesRepository.findById(id, companyId);
    if (!candidate) {
      throw new NotFoundError("Candidate", id);
    }
    return candidate;
  },

  async list(filters: CandidateFilterInput, companyId: string) {
    const { data, total } = await candidatesRepository.findMany({
      ...filters,
      companyId,
    });

    return buildPaginatedResult(data.map(toCandidateDto), total, {
      page: filters.page,
      limit: filters.limit,
    });
  },

  async update(id: string, input: UpdateCandidateInput, companyId: string) {
    const existing = await candidatesRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Candidate", id);
    }

    // If email is changing, check for duplicates
    if (input.email && input.email !== existing.email) {
      const duplicate = await candidatesRepository.findByEmail(
        input.email,
        companyId
      );
      if (duplicate) {
        throw new AppError(
          `A candidate with email '${input.email}' already exists`,
          409,
          "DUPLICATE_CANDIDATE"
        );
      }
    }

    const updated = await candidatesRepository.update(id, companyId, {
      ...input,
      linkedinUrl: input.linkedinUrl || undefined,
    });

    await Promise.all([
      cacheService.del(CacheKeys.candidateDetail(companyId, id)),
      cacheService.del(CacheKeys.candidatesList(companyId)),
    ]);

    logger.info({ candidateId: id, companyId }, "Candidate updated");
    return toCandidateDto(updated);
  },

  async delete(id: string, companyId: string) {
    const existing = await candidatesRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError("Candidate", id);
    }

    await candidatesRepository.delete(id, companyId);

    await Promise.all([
      cacheService.del(CacheKeys.candidateDetail(companyId, id)),
      cacheService.del(CacheKeys.candidatesList(companyId)),
    ]);

    logger.info({ candidateId: id, companyId }, "Candidate deleted");
  },
};
