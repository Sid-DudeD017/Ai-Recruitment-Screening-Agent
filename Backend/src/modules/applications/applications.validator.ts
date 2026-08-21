import { z } from "zod";

// ============================================================================
// Application Validators
// ============================================================================

export const createApplicationSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID is required"),
  jobId: z.string().min(1, "Job ID is required"),
  notes: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  notes: z.string().optional(),
  reason: z.string().optional(), // For rejection reason
  emailBody: z.string().optional(),
});

export const applicationFilterSchema = z.object({
  jobId: z.string().optional(),
  candidateId: z.string().optional(),
  status: z
    .enum([
      "APPLIED",
      "SCREENING",
      "SHORTLISTED",
      "INTERVIEW",
      "OFFERED",
      "HIRED",
      "REJECTED",
    ])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["appliedAt", "status", "matchScore"])
    .default("appliedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
export type ApplicationFilterInput = z.infer<typeof applicationFilterSchema>;
