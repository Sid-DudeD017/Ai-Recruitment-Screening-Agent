import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import ParsedJob
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def analyze_job_node(state: GraphState) -> dict:
    """Extracts structured information from the job description."""
    logger.info("Agent: Analyzing Job Description...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(ParsedJob)
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter and data extractor.\n"
        "Analyze the following job description and extract the key requirements, "
        "skills, experience, and responsibilities.\n"
        "Also identify any potentially biased language and list them in potential_bias_warnings.\n\n"
        "Job Description:\n{job_description}"
    )
    
    chain = prompt | structured_llm
    
    result = chain.invoke({"job_description": state.get("job_description", "")})
    
    return {"parsed_job": result.model_dump()}
