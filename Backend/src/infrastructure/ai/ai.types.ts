/**
 * Type definitions for the external AI service endpoints.
 * Coordinate these with your AI teammate.
 */

// POST /ai/parse-resume
export interface ParseResumeRequest {
  fileUrl: string;
  fileName: string;
}

export interface ParseResumeResponse {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  parsedContent: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  summary: string;
}

// POST /ai/analyze-job
export interface AnalyzeJobRequest {
  title: string;
  description: string;
  requirements: string;
}

export interface AnalyzeJobResponse {
  keySkills: string[];
  experienceLevel: string;
  suggestedQuestions: string[];
  analysis: string;
}

// POST /ai/match
export interface MatchRequest {
  candidateSkills: string[];
  candidateExperience: string;
  jobRequirements: string;
  jobDescription: string;
}

export interface MatchResponse {
  matchScore: number; // 0-100
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

// POST /ai/rank
export interface RankRequest {
  jobId: string;
  candidates: Array<{
    candidateId: string;
    skills: string[];
    experience: string;
    resumeSummary: string;
  }>;
  jobRequirements: string;
}

export interface RankResponse {
  rankings: Array<{
    candidateId: string;
    score: number;
    reasoning: string;
  }>;
}

// POST /ai/generate-email
export interface GenerateEmailRequest {
  type: "interview_invite" | "rejection" | "offer" | "status_update";
  candidateName: string;
  jobTitle: string;
  companyName: string;
  additionalContext?: string;
}

export interface GenerateEmailResponse {
  subject: string;
  body: string;
}

// POST /ai/schedule-interview
export interface ScheduleInterviewAIRequest {
  interviewerAvailability: string[];
  candidatePreferences?: string[];
  durationMinutes: number;
  timezone: string;
}

export interface ScheduleInterviewAIResponse {
  suggestedSlots: Array<{
    startTime: string;
    endTime: string;
    score: number;
  }>;
}

// POST /ai/check-bias
export interface CheckBiasRequest {
  jobTitle: string;
  jobDescription: string;
  requirements: string;
}

export interface CheckBiasResponse {
  hasBias: boolean;
  biasScore: number; // 0-100
  issues: Array<{
    text: string;
    issue: string;
    suggestion: string;
  }>;
  revisedDescription?: string;
}
