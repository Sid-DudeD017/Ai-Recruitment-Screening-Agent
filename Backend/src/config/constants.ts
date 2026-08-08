export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File uploads
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_RESUME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ],

  // Rate limiting
  RATE_LIMIT_GENERAL: { requests: 100, window: "1m" as const },
  RATE_LIMIT_AI: { requests: 10, window: "1m" as const },
  RATE_LIMIT_AUTH: { requests: 20, window: "1m" as const },

  // Cache TTL (seconds)
  CACHE_TTL_SHORT: 60, // 1 minute
  CACHE_TTL_MEDIUM: 300, // 5 minutes
  CACHE_TTL_LONG: 3600, // 1 hour

  // Application status transition order
  APPLICATION_STATUS_ORDER: [
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFERED",
    "HIRED",
  ] as const,
} as const;
