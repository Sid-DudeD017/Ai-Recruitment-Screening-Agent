from typing import TypedDict, List, Optional
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
    score: int = Field(description="Score out of 100 representing how well the candidate matches the job")
    reasoning: str = Field(description="Qualitative reasoning for the score provided")

class BiasReport(BaseModel):
    bias_detected: bool = Field(description="True if potential bias was detected in the matching/scoring phase")
    concerns: List[str] = Field(description="List of specific concerns regarding bias")

class GraphState(TypedDict):
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
