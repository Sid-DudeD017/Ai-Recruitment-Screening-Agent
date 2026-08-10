from typing import TypedDict, List, Optional, Dict, Any
from pydantic import BaseModel, Field

class JobRequirements(BaseModel):
    title: str = Field(description="The job title")
    must_have_skills: List[str] = Field(description="Mandatory skills or qualifications required")
    nice_to_have_skills: List[str] = Field(description="Preferred but not mandatory skills")
    years_of_experience: Optional[int] = Field(description="Minimum years of experience required, if specified", default=None)

class ResumeData(BaseModel):
    candidate_name: str = Field(description="Name of the candidate")
    skills: List[str] = Field(description="List of skills extracted from the resume")
    experience_years: Optional[float] = Field(description="Total years of professional experience, if discernible", default=None)
    education: List[str] = Field(description="List of educational degrees and institutions")

class MatchScore(BaseModel):
    """The result of the matching process between a resume and job description."""
    skill_score: int = Field(description="Score out of 100 based strictly on technical skill overlap")
    experience_score: int = Field(description="Score out of 100 based on years and relevance of experience")
    project_score: int = Field(description="Score out of 100 based on relevant projects")
    education_score: int = Field(description="Score out of 100 based on education and certifications")
    soft_skill_score: int = Field(description="Score out of 100 based on communication and soft skills")
    score: float = Field(description="The final calculated weighted score out of 100")
    reasoning: str = Field(description="Brief explanation of the scores and overall fit")

class BiasReport(BaseModel):
    bias_detected: bool = Field(description="True if potential bias was detected in the matching/scoring phase")
    concerns: List[str] = Field(description="List of specific concerns regarding bias")

class GraphState(TypedDict, total=False):
    """State for the LangGraph pipeline processing a single candidate."""
    # Inputs
    job_description_text: str
    resume_text: str
    
    # Outputs/Intermediate state
    parsed_job: Optional[JobRequirements]
    parsed_resume: Optional[ResumeData]
    match_score: Optional[MatchScore]
    bias_report: Optional[BiasReport]
    generated_email: Optional[str]
    interview_schedule: Optional[Dict[str, Any]]
