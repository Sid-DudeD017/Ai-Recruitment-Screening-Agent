from fastapi import APIRouter, HTTPException, UploadFile, File
from src.schemas.api_schema import StartWorkflowRequest, ResumeWorkflowRequest, APIResponse, RankRequest
from src.graph.workflow import create_workflow
from src.agents.ranker import rank_candidates

router = APIRouter()

workflow = create_workflow()

@router.post("/hiring-workflow", response_model=APIResponse)
def start_hiring_workflow(request: StartWorkflowRequest):
    """
    Start a new hiring workflow.
    """
    initial_state = {
        "workflow_id": request.workflow_id,
        "job_id": request.job_id,
        "candidate_id": request.candidate_id,
        "job_description": request.job_description,
        "resume_text": request.resume_text,
        "candidate_metadata": request.candidate_metadata,
        "interview_requirements": request.interview_requirements,
        "current_step": "orchestrator",
        "workflow_status": "IN_PROGRESS"
    }
    
    try:
        config = {"configurable": {"thread_id": request.workflow_id}}
        final_state = workflow.invoke(initial_state, config=config)
        
        # Check if we hit an interrupt
        current_state_info = workflow.get_state(config)
        is_paused = len(current_state_info.next) > 0
        
        status = "WAITING_FOR_HUMAN" if is_paused else final_state.get("workflow_status", "COMPLETED")
        
        return APIResponse(
            success=True,
            workflowStatus=status,
            nextAction=final_state.get("next_action"),
            requiresHumanReview=is_paused,
            workflowId=request.workflow_id,
            result={
                "candidate_evaluation": final_state.get("candidate_evaluation")
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hiring-workflow/{workflow_id}/resume", response_model=APIResponse)
def resume_hiring_workflow(workflow_id: str, request: ResumeWorkflowRequest):
    """
    Resume a paused workflow after human review.
    """
    config = {"configurable": {"thread_id": workflow_id}}
    
    try:
        # Check if the workflow exists and is paused
        current_state_info = workflow.get_state(config)
        if not current_state_info or len(current_state_info.next) == 0:
            raise HTTPException(status_code=400, detail="Workflow not found or not waiting for human review.")
            
        # Update the state with the recruiter's decision
        workflow.update_state(config, {"recruiter_decision": request.decision})
        
        # Resume the workflow
        final_state = workflow.invoke(None, config=config)
        
        new_state_info = workflow.get_state(config)
        is_paused = len(new_state_info.next) > 0
        
        status = "WAITING_FOR_HUMAN" if is_paused else final_state.get("workflow_status", "COMPLETED")
        
        return APIResponse(
            success=True,
            workflowStatus=status,
            nextAction=final_state.get("next_action"),
            requiresHumanReview=is_paused,
            workflowId=workflow_id,
            result={
                "candidate_evaluation": final_state.get("candidate_evaluation"),
                "email_draft": final_state.get("email_draft"),
                "interview_recommendation": final_state.get("interview_recommendation")
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rank")
def rank_candidates_endpoint(request: RankRequest):
    """
    Ranks multiple candidates based on their evaluations.
    """
    try:
        evaluations = []
        for c in request.candidates:
            evaluations.append({
                "candidate_id": c.get("candidateId"),
                "skills": c.get("skills", []),
                "experience": c.get("experience", ""),
                "summary": c.get("resumeSummary", "")
            })
            
        result = rank_candidates(request.jobRequirements, evaluations)
        # return the result directly to match node client expectations
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from src.agents.resume_parser import parse_resume_node
from src.agents.job_analyzer import analyze_job_node
from src.agents.matcher import match_candidate_node
from src.agents.bias_detector import detect_bias_node
from pydantic import BaseModel
import requests
from io import BytesIO
from pypdf import PdfReader

class ParseResumeRequest(BaseModel):
    fileUrl: str
    fileName: str

class AnalyzeJobRequest(BaseModel):
    title: str
    description: str
    requirements: str

class MatchRequest(BaseModel):
    candidateSkills: list[str]
    candidateExperience: str
    jobRequirements: str
    jobDescription: str

class BiasRequest(BaseModel):
    jobTitle: str
    jobDescription: str
    requirements: str

@router.post("/parse-resume")
def parse_resume_endpoint(request: ParseResumeRequest):
    try:
        # Fetch the PDF from the URL
        response = requests.get(request.fileUrl)
        response.raise_for_status()
        
        # Extract text from the PDF
        reader = PdfReader(BytesIO(response.content))
        resume_text = ""
        for page in reader.pages:
            resume_text += page.extract_text() + "\n"
            
        res = parse_resume_node({"resume_text": resume_text, "candidate_metadata": {"fileName": request.fileName}})
        return res.get("parsed_resume", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import docx

@router.post("/upload-and-parse-resume")
def upload_and_parse_resume_endpoint(file: UploadFile = File(...)):
    try:
        content = file.file.read()
        resume_text = ""
        
        if file.filename.lower().endswith(".docx") or file.filename.lower().endswith(".doc"):
            doc = docx.Document(BytesIO(content))
            for para in doc.paragraphs:
                resume_text += para.text + "\n"
        else:
            reader = PdfReader(BytesIO(content))
            for page in reader.pages:
                resume_text += page.extract_text() + "\n"

        print("BEFORE parse_resume_node")
        res = parse_resume_node({"resume_text": resume_text, "candidate_metadata": {"fileName": file.filename}})
        print("AFTER parse_resume_node")
        return res.get("parsed_resume", {})
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.post("/analyze-job")
def analyze_job_endpoint(request: AnalyzeJobRequest):
    try:
        combined_desc = f"Title: {request.title}\nDescription: {request.description}\nRequirements: {request.requirements}"
        res = analyze_job_node({"job_description": combined_desc})
        return res.get("parsed_job", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match")
def match_endpoint(request: MatchRequest):
    try:
        parsed_job = {
            "required_experience": request.jobRequirements,
            "analysis": request.jobDescription
        }
        parsed_resume = {
            "skills": request.candidateSkills,
            "summary": request.candidateExperience
        }
        res = match_candidate_node({"parsed_job": parsed_job, "parsed_resume": parsed_resume})
        return res.get("match_result", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-bias")
def check_bias_endpoint(request: BiasRequest):
    try:
        parsed_job = {
            "title": request.jobTitle,
            "description": request.jobDescription,
            "requirements": request.requirements
        }
        res = detect_bias_node({"parsed_job": parsed_job, "parsed_resume": {}, "match_result": {}})
        return res.get("bias_result", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from src.agents.interviewer import schedule_interview_node
from src.agents.emailer import generate_email_node

class InterviewRequest(BaseModel):
    interviewerAvailability: list[str]
    candidatePreferences: list[str] | None = None
    durationMinutes: int = 60
    timezone: str = "UTC"

class EmailRequest(BaseModel):
    type: str
    candidateName: str
    jobTitle: str
    companyName: str
    additionalContext: str | None = None

@router.post("/schedule-interview")
def schedule_interview_endpoint(request: InterviewRequest):
    try:
        # Pack the incoming fields into the interview_requirements dict expected by the node
        interview_requirements = {
            "interviewerAvailability": request.interviewerAvailability,
            "candidatePreferences": request.candidatePreferences,
            "durationMinutes": request.durationMinutes,
            "timezone": request.timezone
        }
        
        res = schedule_interview_node({
            "parsed_job": {},
            "parsed_resume": {},
            "interview_requirements": interview_requirements
        })
        
        # Return only the recommendation directly to match ScheduleInterviewAIResponse type in Node
        # Wait, the other endpoints return {"success": True, "result": ...} 
        # But since the Node client just expects the raw ScheduleInterviewAIResponse from response.data, 
        # we will return it directly to fix the typescript typing expectation.
        return res.get("interview_recommendation", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-email")
def generate_email_endpoint(request: EmailRequest):
    try:
        decision = "APPROVE" if request.type == "interview_invite" else "REJECT" if request.type == "rejection" else request.type.upper()
        
        parsed_resume = {
            "name": request.candidateName,
            "summary": f"Applying for {request.jobTitle} at {request.companyName}. Context: {request.additionalContext or ''}"
        }
        
        res = generate_email_node({
            "recruiter_decision": decision, 
            "parsed_resume": parsed_resume, 
            "interview_recommendation": None,
            "additional_context": request.additionalContext
        })
        return res.get("email_draft", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
