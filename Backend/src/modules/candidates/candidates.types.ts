import type { Candidate } from "@/generated/prisma/client";

// ============================================================================
// Candidate DTOs
// ============================================================================

export interface CandidateDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  linkedinUrl: string | null;
  source: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    applications: number;
    resumes: number;
  };
}

export interface CandidateWithRelations extends CandidateDto {
  resumes: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    skills: string[];
    createdAt: Date;
  }>;
  applications: Array<{
    id: string;
    jobId: string;
    status: string;
    matchScore: number | null;
    appliedAt: Date;
  }>;
}

export interface CandidateListFilters {
  companyId: string;
  search?: string;
  source?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function toCandidateDto(
  candidate: Candidate & { _count?: { applications: number; resumes: number } }
): CandidateDto {
  return {
    id: candidate.id,
    email: candidate.email,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    phone: candidate.phone,
    linkedinUrl: candidate.linkedinUrl,
    source: candidate.source,
    companyId: candidate.companyId,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    _count: candidate._count,
  };
}
