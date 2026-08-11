import json
import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import InterviewRecommendation
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def schedule_interview_node(state: GraphState) -> dict:
    """Recommends interview slots based on candidate and job info."""
    logger.info("Agent: Recommending Interview Slots...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(InterviewRecommendation)
    
    prompt = PromptTemplate.from_template(
        "You are an AI Scheduling Assistant.\n"
        "Given the Job Requirements, Candidate Profile, and the provided availability constraints (interview_requirements),\n"
        "recommend the best interview slots.\n\n"
        "Job:\n{job_reqs}\n\n"
        "Candidate:\n{candidate}\n\n"
        "Constraints/Availability:\n{availability}\n\n"
        "Provide recommended slots, duration, and the reason for this choice."
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({
        "job_reqs": json.dumps(state.get("parsed_job", {}), indent=2),
        "candidate": json.dumps(state.get("parsed_resume", {}), indent=2),
        "availability": json.dumps(state.get("interview_requirements", {}), indent=2)
    })
    
    return {"interview_recommendation": result.model_dump()}
