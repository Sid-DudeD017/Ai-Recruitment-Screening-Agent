import { z } from "zod";

// ============================================================================
// Job Validators
// ============================================================================

export const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  requirements: z.string().optional(),
  location: z.string().max(200).optional(),
  type: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE", "INTERNSHIP"])
    .default("FULL_TIME"),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  currency: z.string().max(3).default("USD"),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMax >= data.salaryMin;
    }
    return true;
  },
  { message: "salaryMax must be greater than or equal to salaryMin", path: ["salaryMax"] }
);

export const updateJobSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(20).optional(),
  requirements: z.string().optional(),
  location: z.string().max(200).optional(),
  type: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE", "INTERNSHIP"])
    .optional(),
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  currency: z.string().max(3).optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]).optional(),
});

export const jobFilterSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]).optional(),
  type: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE", "INTERNSHIP"])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "title", "salaryMin", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
