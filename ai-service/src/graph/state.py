from typing import TypedDict, Optional, List, Dict, Any

class GraphState(TypedDict, total=False):
    # Identifiers
    workflow_id: str
    job_id: str
    candidate_id: str
    
    # Inputs
    job_description: Optional[str]
    resume_text: Optional[str]
    candidate_metadata: Optional[Dict[str, Any]]
    interview_requirements: Optional[Dict[str, Any]]
    
    # Processed Data
    parsed_job: Optional[Dict[str, Any]]
    parsed_resume: Optional[Dict[str, Any]]
    
    # Results
    triage_result: Optional[Dict[str, Any]]
    match_result: Optional[Dict[str, Any]]
    bias_result: Optional[Dict[str, Any]]
    bias_feedback: Optional[str]
    candidate_evaluation: Optional[Dict[str, Any]]
    ranking_result: Optional[List[Dict[str, Any]]]
    
    # Actionable outputs
    interview_recommendation: Optional[Dict[str, Any]]
    email_draft: Optional[Dict[str, Any]]
    
    # Human-in-the-loop
    recruiter_decision: Optional[str] # "APPROVE", "REJECT", None
    
    # Orchestrator tracking
    current_step: str
    next_action: str
    workflow_status: str # "IN_PROGRESS", "WAITING_FOR_HUMAN", "COMPLETED", "FAILED"
    requires_human_review: bool
    decision_reason: str
