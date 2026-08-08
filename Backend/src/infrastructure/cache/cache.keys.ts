/**
 * Centralized cache key templates.
 * All Redis keys are defined here to prevent collisions and make invalidation auditable.
 */
export const CacheKeys = {
  // Jobs
  jobsList: (companyId: string) => `company:${companyId}:jobs:list`,
  jobDetail: (companyId: string, jobId: string) => `company:${companyId}:jobs:${jobId}`,

  // Candidates
  candidatesList: (companyId: string) => `company:${companyId}:candidates:list`,
  candidateDetail: (companyId: string, candidateId: string) =>
    `company:${companyId}:candidates:${candidateId}`,

  // Applications
  applicationsList: (companyId: string) => `company:${companyId}:applications:list`,
  applicationsByJob: (companyId: string, jobId: string) =>
    `company:${companyId}:jobs:${jobId}:applications`,

  // Dashboard
  dashboardStats: (companyId: string) => `company:${companyId}:dashboard:stats`,
  dashboardPipeline: (companyId: string) => `company:${companyId}:dashboard:pipeline`,

  // Rate limiting
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
} as const;
