import { z } from "zod";

// ============================================================================
// Candidate Validators
// ============================================================================

export const createCandidateSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  source: z.string().max(100).optional(),
});

export const updateCandidateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  source: z.string().max(100).optional(),
});

export const candidateFilterSchema = z.object({
  search: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "firstName", "lastName", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type CandidateFilterInput = z.infer<typeof candidateFilterSchema>;
