import json
import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import BiasResult
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def detect_bias_node(state: GraphState) -> dict:
    """Analyzes job description, evaluation, and matching criteria for bias."""
    logger.info("Agent: Detecting Bias...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(BiasResult)
    
    prompt = PromptTemplate.from_template(
        "You are an AI fairness and compliance monitor.\n"
        "Review the Job Requirements, the Candidate Match Results, and the Candidate Profile.\n"
        "Identify potentially problematic or biased criteria. Do NOT infer protected characteristics "
        "(race, religion, gender, sexual orientation, disability, etc.) from resumes.\n"
        "Focus on systemic biases (e.g. over-indexing on specific universities, ageist language in JD).\n\n"
        "Job Requirements:\n{job_reqs}\n\n"
        "Match Results:\n{match_results}\n\n"
        "Candidate Profile:\n{candidate_profile}\n\n"
        "Produce warnings and recommendations if bias is detected."
    )
    
    chain = prompt | structured_llm
    
    job_reqs = json.dumps(state.get("parsed_job", {}), indent=2)
    match_results = json.dumps(state.get("match_result", {}), indent=2)
    candidate_profile = json.dumps(state.get("parsed_resume", {}), indent=2)
    
    result = chain.invoke({
        "job_reqs": job_reqs,
        "match_results": match_results,
        "candidate_profile": candidate_profile
    })
    
    return {"bias_result": result.model_dump()}
