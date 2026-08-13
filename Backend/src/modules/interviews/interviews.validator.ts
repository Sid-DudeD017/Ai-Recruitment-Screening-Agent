import { z } from "zod";

// ============================================================================
// Interview Validators
// ============================================================================

export const createInterviewSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  scheduledAt: z.coerce.date().refine(
    (date) => date > new Date(),
    "Interview must be scheduled in the future"
  ),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  type: z.enum(["PHONE", "VIDEO", "ONSITE", "TECHNICAL"]).default("VIDEO"),
  location: z.string().max(500).optional(),
  meetingLink: z.string().url("Invalid meeting link").optional().or(z.literal("")),
  interviewerIds: z.array(z.string()).min(1, "At least one interviewer is required"),
  notes: z.string().optional(),
});

export const updateInterviewSchema = z.object({
  scheduledAt: z.coerce.date().refine(
    (date) => date > new Date(),
    "Interview must be scheduled in the future"
  ).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  type: z.enum(["PHONE", "VIDEO", "ONSITE", "TECHNICAL"]).optional(),
  location: z.string().max(500).optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  interviewerIds: z.array(z.string()).min(1).optional(),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const interviewFilterSchema = z.object({
  applicationId: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["scheduledAt", "createdAt", "status"]).default("scheduledAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createBatchInterviewSchema = z.object({
  applicationIds: z.array(z.string().min(1)).min(1, "At least one application ID is required"),
  baseScheduledAt: z.coerce.date(),
  staggerMinutes: z.number().int().min(0).default(0),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  type: z.enum(["PHONE", "VIDEO", "ONSITE", "TECHNICAL"]).default("VIDEO"),
  interviewerIds: z.array(z.string()).min(1, "At least one interviewer is required"),
  location: z.string().optional(),
  meetingLink: z.string().url("Invalid meeting link").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type CreateBatchInterviewInput = z.infer<typeof createBatchInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type InterviewFilterInput = z.infer<typeof interviewFilterSchema>;

