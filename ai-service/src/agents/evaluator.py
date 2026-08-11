import json
import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import CandidateEvaluation
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def evaluate_candidate_node(state: GraphState) -> dict:
    """Synthesizes match result, bias report, job reqs, and candidate profile for a final recommendation."""
    logger.info("Agent: Evaluating Candidate...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(CandidateEvaluation)
    
    prompt = PromptTemplate.from_template(
        "You are the Lead Technical Recruiter AI.\n"
        "Synthesize the following information and provide a final recommendation (PROCEED, REVIEW, or REJECT).\n"
        "Note: Your recommendation is NOT the final hiring decision. The human recruiter will review it.\n\n"
        "Job Requirements:\n{job_reqs}\n\n"
        "Candidate Profile:\n{candidate_profile}\n\n"
        "Match Results:\n{match_results}\n\n"
        "Bias Analysis:\n{bias_results}\n\n"
        "Provide your recommendation, confidence score, strengths, concerns, and a final explanation."
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "job_reqs": json.dumps(state.get("parsed_job", {}), indent=2),
        "candidate_profile": json.dumps(state.get("parsed_resume", {}), indent=2),
        "match_results": json.dumps(state.get("match_result", {}), indent=2),
        "bias_results": json.dumps(state.get("bias_result", {}), indent=2)
    })
    
    return {"candidate_evaluation": result.model_dump()}
