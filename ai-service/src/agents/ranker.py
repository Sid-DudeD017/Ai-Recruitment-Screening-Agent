import json
import logging
from typing import List
from langchain_core.prompts import PromptTemplate
from src.schemas.data_schemas import CandidateRanking
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def rank_candidates(job_description: str, candidate_evaluations: List[dict]) -> dict:
    """Ranks multiple candidates based on their evaluations."""
    logger.info("Agent: Ranking Candidates...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(CandidateRanking)
    
    prompt = PromptTemplate.from_template(
        "You are an AI Recruitment Manager.\n"
        "Given the Job Description and the evaluations of multiple candidates, rank them from best to worst.\n"
        "Ranking must be based on job-relevant information only.\n\n"
        "Job Description:\n{job_description}\n\n"
        "Candidate Evaluations:\n{evaluations}\n\n"
        "Return the ranked list of candidates and a detailed explanation of the ranking."
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "job_description": job_description,
        "evaluations": json.dumps(candidate_evaluations, indent=2)
    })
    
    return result.model_dump()
