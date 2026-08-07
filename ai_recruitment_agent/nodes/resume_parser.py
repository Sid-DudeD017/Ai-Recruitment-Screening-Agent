from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from ai_recruitment_agent.state import GraphState, ResumeData
from ai_recruitment_agent.llm import get_llm

def parse_resume(state: GraphState) -> Dict[str, Any]:
    """Node that extracts structured information from the candidate's resume."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(ResumeData)
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter. Analyze the following resume "
        "and extract the candidate's name, their key skills, total years of professional "
        "experience (estimate a number if not explicitly stated, or leave empty if completely unknown), "
        "and their educational background.\n\n"
        "Resume:\n{resume}"
    )
    
    chain = prompt | structured_llm
    
    print("--- PARSING RESUME ---")
    result = chain.invoke({"resume": state["resume_text"]})
    return {"parsed_resume": result}
