import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import ParsedResume
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def parse_resume_node(state: GraphState) -> dict:
    """Extracts structured information from the candidate's resume."""
    logger.info("Agent: Parsing Resume...")
    
    llm = get_llm()
    structured_llm = llm.with_structured_output(ParsedResume)
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter and data extractor.\n"
        "Extract the required fields from the following resume. "
        "If a field is not present, leave it empty or provide an empty list.\n\n"
        "Metadata (if any):\n{metadata}\n\n"
        "Resume Text:\n{resume}"
    )
    
    chain = prompt | structured_llm
    
    metadata_str = str(state.get("candidate_metadata", {}))
    result = chain.invoke({
        "resume": state.get("resume_text", ""),
        "metadata": metadata_str
    })
    
    return {"parsed_resume": result.model_dump()}
