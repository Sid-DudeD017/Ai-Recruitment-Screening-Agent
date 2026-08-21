from langchain_google_genai import ChatGoogleGenerativeAI
from src.config.settings import settings
from src.graph.state import GraphState
from src.schemas.agent_schemas import OrchestratorDecision
import logging

logger = logging.getLogger(__name__)

def get_llm():
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        temperature=0,
        google_api_key=settings.GEMINI_API_KEY,
        timeout=60
    )

def orchestrate(state: GraphState) -> dict:
    """
    Central Hiring Orchestrator Agent.
    Evaluates current state and decides the next action.
    Prioritizes strict deterministic routing for prerequisites.
    """
    logger.info("Orchestrator evaluating state...")
    
    # 1. Deterministic Prerequisite Routing
    job_desc = state.get("job_description")
    resume_text = state.get("resume_text")
    parsed_job = state.get("parsed_job")
    parsed_resume = state.get("parsed_resume")
    match_result = state.get("match_result")
    bias_result = state.get("bias_result")
    evaluation = state.get("candidate_evaluation")
    recruiter_decision = state.get("recruiter_decision")
    interview_rec = state.get("interview_recommendation")
    email_draft = state.get("email_draft")
    
    # Rule 1: Parse Job
    if job_desc and not parsed_job:
        return {
            "next_action": "analyze_job",
            "decision_reason": "Job description exists but is not parsed yet."
        }
        
    # Rule 2: Parse Resume
    if resume_text and not parsed_resume:
        return {
            "next_action": "parse_resume",
            "decision_reason": "Resume text exists but is not parsed yet."
        }
        
    # Rule 3: Match
    if parsed_job and parsed_resume and not match_result:
        return {
            "next_action": "match_candidate",
            "decision_reason": "Job and resume are parsed, proceeding to matching."
        }
        
    # Rule 4: Bias Detection
    if match_result and not bias_result:
        return {
            "next_action": "detect_bias",
            "decision_reason": "Match result exists, proceeding to bias detection."
        }
        
    # Rule 4.5: Bias Correction Loop
    if match_result and bias_result and bias_result.get("hasBias") == True:
        logger.warning("Agent: Bias detected! Looping back to matcher.")
        issues = bias_result.get("issues", [])
        return {
            "next_action": "match_candidate",
            "decision_reason": "Bias detected! Routing back to matcher to correct bias.",
            "bias_result": None,
            "bias_feedback": f"Please fix these bias issues: {issues}"
        }
        
    # Rule 5: Candidate Evaluation
    if match_result and bias_result and bias_result.get("hasBias") == False and not evaluation:
        return {
            "next_action": "evaluate_candidate",
            "decision_reason": "Match and bias results exist, generating final evaluation."
        }
        
    # Rule 6: Human Review
    if evaluation and not recruiter_decision:
        return {
            "next_action": "human_review",
            "decision_reason": "Candidate evaluation is complete, pausing for human review.",
            "requires_human_review": True,
            "workflow_status": "WAITING_FOR_HUMAN"
        }
        
    # Rule 7: Post-Approval Routing (Approves)
    if recruiter_decision == "APPROVE":
        if not interview_rec:
            return {
                "next_action": "schedule_interview",
                "decision_reason": "Recruiter approved, proceeding to schedule interview."
            }
        if not email_draft:
            return {
                "next_action": "generate_email",
                "decision_reason": "Interview scheduled, generating approval email."
            }
            
    # Rule 8: Post-Approval Routing (Rejects)
    if recruiter_decision == "REJECT":
        if not email_draft:
            return {
                "next_action": "generate_email",
                "decision_reason": "Recruiter rejected, generating rejection email."
            }
            
    # Rule 9: Completion
    if email_draft or (recruiter_decision == "REJECT" and email_draft):
        return {
            "next_action": "end",
            "decision_reason": "All required tasks are completed.",
            "workflow_status": "COMPLETED"
        }
        
    # Fallback to LLM if state is ambiguous or requires complex reasoning
    logger.info("State ambiguous, falling back to LLM Orchestrator...")
    llm = get_llm().with_structured_output(OrchestratorDecision)
    
    # We pass a summary of the state rather than the full texts to save tokens
    state_summary = {
        "has_job_description": bool(job_desc),
        "has_resume": bool(resume_text),
        "has_parsed_job": bool(parsed_job),
        "has_parsed_resume": bool(parsed_resume),
        "has_match_result": bool(match_result),
        "has_bias_result": bool(bias_result),
        "has_evaluation": bool(evaluation),
        "recruiter_decision": recruiter_decision,
        "has_interview": bool(interview_rec),
        "has_email": bool(email_draft)
    }
    
    prompt = f"""
    You are the Hiring Orchestrator Agent. Your job is to decide the next action in a recruitment workflow.
    Given the current state summary:
    {state_summary}
    
    Decide the most logical next_action from the available options.
    """
    
    decision = llm.invoke(prompt)
    
    return {
        "next_action": decision.next_action,
        "decision_reason": decision.decision_reason
    }
