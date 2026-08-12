import logging
from langchain_core.prompts import PromptTemplate
from src.graph.state import GraphState
from src.schemas.data_schemas import ParsedResume,Education
from src.agents.orchestrator import get_llm

logger = logging.getLogger(__name__)

def parse_resume_node(state: GraphState) -> dict:
    """Extracts structured information from the candidate's resume."""
    try:
        logger.info("Agent: Parsing Resume...")
        print("PARSER 1: entered parse_resume_node")
        llm = get_llm()

        print("PARSER 2: get_llm worked")
        print("ParsedResume:", ParsedResume)
        print("ParsedResume module:", ParsedResume.__module__)
        print("ParsedResume fields:", ParsedResume.model_fields)

        print("Education:", Education)
        print("Education module:", Education.__module__)
        print("Education fields:", Education.model_fields)

        structured_llm = llm.with_structured_output(ParsedResume)
        print("PARSER 3: with_structured_output worked")
    except Exception as e:
        print("🔥 PARSER ERROR:", repr(e))
        raise

   
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter and data extractor.\n"
        "Extract the required fields from the following resume. "
        "If a field is not present, leave it empty or provide an empty list.\n\n"
        "Metadata (if any):\n{metadata}\n\n"
        "Resume Text:\n{resume}"
    )
    
    chain = prompt | structured_llm
    print("chain created ")
    metadata_str = str(state.get("candidate_metadata", {}))
    print("PARSER 5: invoking LLM")
    result = chain.invoke({
        "resume": state.get("resume_text", ""),
        "metadata": metadata_str
    })
    
    return {"parsed_resume": result.model_dump()}
