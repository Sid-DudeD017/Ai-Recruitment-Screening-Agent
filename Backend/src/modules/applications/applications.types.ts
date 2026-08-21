import type { Application, ApplicationStatus } from "@/generated/prisma/client";

// ============================================================================
// Application DTOs
// ============================================================================

export interface ApplicationDto {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  matchScore: number | null;
  aiAnalysis: unknown;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
}

export interface ApplicationWithRelations extends ApplicationDto {
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
    status: string;
  };
  interviews: Array<{
    id: string;
    scheduledAt: Date;
    status: string;
    type: string;
  }>;
  emailDraft?: {
    status: string;
  };
}

export interface UpdateApplicationStatusInput {
  status: string;
  notes?: string;
  emailBody?: string;
}

export interface ApplicationListFilters {
  companyId: string;
  jobId?: string;
  candidateId?: string;
  status?: ApplicationStatus;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function toApplicationDto(application: any): ApplicationWithRelations | ApplicationDto {
  return {
    id: application.id,
    candidateId: application.candidateId,
    jobId: application.jobId,
    status: application.status,
    matchScore: application.matchScore,
    aiAnalysis: application.aiAnalysis,
    notes: application.notes,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
    ...(application.candidate && { candidate: application.candidate }),
    ...(application.job && { job: application.job }),
    ...(application.interviews && { interviews: application.interviews }),
    ...(application.emailDraft && { emailDraft: application.emailDraft }),
  };
}
