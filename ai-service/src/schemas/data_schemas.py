from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# --- Resume Parser Schemas ---
class WorkExperience(BaseModel):
    company: str = Field(default="")
    title: str = Field(default="")
    duration: str = Field(default="")
    description: str = Field(default="")

class Education(BaseModel):
    institution: str = Field(default="")
    degree: str = Field(default="")
    year: str = Field(default="")

class ParsedResume(BaseModel):
    parsedContent: str = Field(default="")
    summary: str = Field(default="")
    name: str = Field(default="")
    email: str = Field(default="")
    phone: str = Field(default="")
    skills: List[str] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    experience: List[WorkExperience] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    github: str = Field(default="")
    linkedin: str = Field(default="")
    portfolio: str = Field(default="")

# --- Job Analyzer Schemas ---
class ParsedJob(BaseModel):
    keySkills: List[str] = Field(default_factory=list)
    experienceLevel: str = Field(default="")
    suggestedQuestions: List[str] = Field(default_factory=list)
    analysis: str = Field(default="")
    # Additional fields maintained for backward compatibility with graph logic
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    required_experience: str = Field(default="")
    education_requirements: str = Field(default="")
    responsibilities: List[str] = Field(default_factory=list)
    technical_requirements: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    important_keywords: List[str] = Field(default_factory=list)
    potential_bias_warnings: List[str] = Field(default_factory=list)

# --- Matcher Schemas ---
class MatchResult(BaseModel):
    matchScore: int = Field(description="Score out of 100")
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    recommendation: str = Field(description="Detailed explanation grounded in supplied data")
    overallScore: int = Field(default=0, description="Backward compatibility score")
    skillScore: int = Field(default=0, description="Score out of 100")
    experienceScore: int = Field(default=0, description="Score out of 100")
    educationScore: int = Field(default=0, description="Score out of 100")
    projectScore: int = Field(default=0, description="Score out of 100")

# --- Bias Detection Schemas ---
class BiasIssue(BaseModel):
    text: str = Field(default="")
    issue: str = Field(default="")
    suggestion: str = Field(default="")

class BiasResult(BaseModel):
    hasBias: bool = Field(default=False)
    biasScore: int = Field(default=0, description="0-100")
    issues: List[BiasIssue] = Field(default_factory=list)
    revisedDescription: str = Field(default="")

# --- Evaluation Schemas ---
class CandidateEvaluation(BaseModel):
    recommendation: Literal["PROCEED", "REVIEW", "REJECT"] = Field(description="PROCEED, REVIEW, or REJECT")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    strengths: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    explanation: str = Field(description="Final summary explanation")

# --- Interview Schemas ---
class SuggestedSlot(BaseModel):
    startTime: str = Field(description="Suggested start time (e.g., ISO 8601 or descriptive)")
    endTime: str = Field(description="Suggested end time")
    score: int = Field(description="Score between 0 and 100 representing how good the slot is based on preferences")

class InterviewRecommendation(BaseModel):
    suggestedSlots: List[SuggestedSlot] = Field(default_factory=list)
    reason: str = Field(default="")

# --- Email Schemas ---
class EmailDraft(BaseModel):
    emailType: str = Field(description="interview invitation, rejection, follow-up, etc.")
    subject: str = Field(default="")
    body: str = Field(default="")

# --- Ranking Schemas ---
class RankedCandidate(BaseModel):
    candidateId: str
    score: float
    reasoning: str

class CandidateRanking(BaseModel):
    rankings: List[RankedCandidate] = Field(default_factory=list)
