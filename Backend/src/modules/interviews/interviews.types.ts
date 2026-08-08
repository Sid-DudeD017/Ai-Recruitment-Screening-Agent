import type { Interview, InterviewStatus, InterviewType } from "@/generated/prisma/client";

// ============================================================================
// Interview DTOs
// ============================================================================

export interface InterviewDto {
  id: string;
  applicationId: string;
  scheduledAt: Date;
  durationMinutes: number;
  type: InterviewType;
  status: InterviewStatus;
  location: string | null;
  meetingLink: string | null;
  calendarEventId: string | null;
  interviewerIds: string[];
  feedback: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewWithRelations extends InterviewDto {
  application: {
    id: string;
    status: string;
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    job: {
      id: string;
      title: string;
    };
  };
}

export interface InterviewListFilters {
  companyId: string;
  applicationId?: string;
  status?: InterviewStatus;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function toInterviewDto(interview: Interview): InterviewDto {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
    type: interview.type,
    status: interview.status,
    location: interview.location,
    meetingLink: interview.meetingLink,
    calendarEventId: interview.calendarEventId,
    interviewerIds: interview.interviewerIds,
    feedback: interview.feedback,
    rating: interview.rating,
    notes: interview.notes,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
  };
}
