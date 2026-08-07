from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from ai_recruitment_agent.state import GraphState, JobRequirements
from ai_recruitment_agent.llm import get_llm

def parse_jd(state: GraphState) -> Dict[str, Any]:
    """Node that extracts structured information from the job description."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(JobRequirements)
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter. Analyze the following job description "
        "and extract the key requirements, including the job title, must-have skills, "
        "nice-to-have skills, and minimum years of experience if mentioned.\n\n"
        "Job Description:\n{job_description}"
    )
    
    chain = prompt | structured_llm
    
    print("--- PARSING JOB DESCRIPTION ---")
    result = chain.invoke({"job_description": state["job_description_text"]})
    return {"parsed_job": result}
