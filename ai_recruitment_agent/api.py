from fastapi import FastAPI, HTTPException, UploadFile, File
import tempfile
import os
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ai_recruitment_agent.nodes.jd_parser import parse_jd
from ai_recruitment_agent.nodes.resume_parser import parse_resume
from ai_recruitment_agent.nodes.matcher import match_candidate
from ai_recruitment_agent.nodes.bias_detector import detect_bias
from ai_recruitment_agent.nodes.email_generator import generate_email
from ai_recruitment_agent.nodes.interview_agent import schedule_interview
from ai_recruitment_agent.utils.ocr import extract_text_from_pdf

from ai_recruitment_agent.state import JobRequirements, ResumeData, MatchScore, BiasReport, GraphState

app = FastAPI(
    title="AI Recruitment Screening API",
    description="REST APIs for the AI Recruitment Agent processing pipelines.",
    version="1.0.0"
)

# --- Request Models ---

class ParseResumeRequest(BaseModel):
    resume_text: str

class AnalyzeJobRequest(BaseModel):
    job_description_text: str

class MatchRequest(BaseModel):
    job_requirements: JobRequirements
    resume_data: ResumeData

class RankCandidateRequest(BaseModel):
    name: str
    score: int
    reasoning: str
    bias_concerns: List[str]
    email_draft: str

class RankRequest(BaseModel):
    candidates: List[RankCandidateRequest]

class EmailRequest(BaseModel):
    job_requirements: JobRequirements
    resume_data: ResumeData
    match_score: MatchScore

class CheckBiasRequest(BaseModel):
    resume_data: ResumeData
    match_score: MatchScore

# --- Helper to convert dict output to final model dict ---
def safe_extract(node_result: Dict[str, Any], key: str):
    obj = node_result.get(key)
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return obj

# --- API Endpoints ---

@app.post("/ai/parse-resume", response_model=ResumeData)
async def api_parse_resume(req: ParseResumeRequest):
    state = GraphState(resume_text=req.resume_text, job_description_text="")
    try:
        result = parse_resume(state)
        return safe_extract(result, "parsed_resume")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/upload-and-parse-resume", response_model=ResumeData)
async def api_upload_and_parse_resume(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    # Save the file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
        
    try:
        # Extract text via OCR
        resume_text = extract_text_from_pdf(temp_path)
        
        # Parse it
        state = GraphState(resume_text=resume_text, job_description_text="")
        result = parse_resume(state)
        return safe_extract(result, "parsed_resume")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/ai/analyze-job", response_model=JobRequirements)
async def api_analyze_job(req: AnalyzeJobRequest):
    state = GraphState(job_description_text=req.job_description_text, resume_text="")
    try:
        result = parse_jd(state)
        return safe_extract(result, "parsed_job")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/match", response_model=MatchScore)
async def api_match(req: MatchRequest):
    state = GraphState(
        job_description_text="",
        resume_text="",
        parsed_job=req.job_requirements,
        parsed_resume=req.resume_data
    )
    try:
        result = match_candidate(state)
        return safe_extract(result, "match_score")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/rank", response_model=List[RankCandidateRequest])
async def api_rank(req: RankRequest):
    try:
        # Sort candidates descending by score
        ranked = sorted(req.candidates, key=lambda x: x.score, reverse=True)
        return ranked
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate-email")
async def api_generate_email(req: EmailRequest):
    state = GraphState(
        job_description_text="",
        resume_text="",
        parsed_job=req.job_requirements,
        parsed_resume=req.resume_data,
        match_score=req.match_score
    )
    try:
        result = generate_email(state)
        return {"email_draft": result.get("generated_email", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/check-bias", response_model=BiasReport)
async def api_check_bias(req: CheckBiasRequest):
    state = GraphState(
        job_description_text="",
        resume_text="",
        parsed_resume=req.resume_data,
        match_score=req.match_score
    )
    try:
        result = detect_bias(state)
        return safe_extract(result, "bias_report")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/schedule-interview")
async def api_schedule_interview(req: CheckBiasRequest):
    # Reusing CheckBiasRequest because it needs match_score and resume_data
    state = GraphState(
        job_description_text="",
        resume_text="",
        parsed_resume=req.resume_data,
        match_score=req.match_score
    )
    try:
        result = schedule_interview(state)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Optional: logic to run it directly
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
