from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class StartWorkflowRequest(BaseModel):
    workflow_id: str
    job_id: str
    candidate_id: str
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    candidate_metadata: Optional[Dict[str, Any]] = None
    interview_requirements: Optional[Dict[str, Any]] = None

class ResumeWorkflowRequest(BaseModel):
    decision: str = Field(description="APPROVE or REJECT")

from typing import List

class APIResponse(BaseModel):
    success: bool
    workflowStatus: str
    result: Optional[Dict[str, Any]] = None
    nextAction: Optional[str] = None
    requiresHumanReview: bool = False
    workflowId: Optional[str] = None
    error: Optional[str] = None
    code: Optional[str] = None

class RankRequest(BaseModel):
    jobId: str
    candidates: List[Dict[str, Any]]
    jobRequirements: str
