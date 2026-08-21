import json
import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import MatchResult
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def match_candidate_node(state: GraphState) -> dict:
    """Evaluates the candidate's structured profile against the structured job requirements."""
    logger.info("Agent: Matching Candidate...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(MatchResult)
    
    bias_feedback = state.get("bias_feedback", "")
    bias_instruction = (
        f"\n\nIMPORTANT - PREVIOUS BIAS FEEDBACK:\n{bias_feedback}\n"
        "You MUST adjust your scoring and reasoning to completely eliminate these biases. "
        "Do not penalize the candidate for reasons flagged as biased."
    ) if bias_feedback else ""
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter AI. Grade the candidate strictly out of 100 "
        "on the given categories based ONLY on the provided candidate profile and job requirements.\n\n"
        "Job Requirements:\n{job_reqs}\n\n"
        "Candidate Profile:\n{candidate_profile}\n\n"
        "Provide your scores, identify strengths, missing requirements, and write a brief explanation. "
        "Ensure the explanation is grounded in the supplied data." + bias_instruction
    )
    
    chain = prompt | structured_llm
    
    # We dump to JSON strings for prompt readability
    job_reqs = json.dumps(state.get("parsed_job", {}), indent=2)
    candidate_profile = json.dumps(state.get("parsed_resume", {}), indent=2)
    
    result = chain.invoke({
        "job_reqs": job_reqs,
        "candidate_profile": candidate_profile
    })
    
    # Return bias_feedback as None to clear it after using it (optional, but clean)
    return {"match_result": result.model_dump(), "bias_feedback": None}
