from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from ai_recruitment_agent.state import GraphState, BiasReport
from ai_recruitment_agent.llm import get_llm

def detect_bias(state: GraphState) -> Dict[str, Any]:
    """Node that analyzes the match reasoning to detect potential biases."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(BiasReport)
    
    prompt = PromptTemplate.from_template(
        "You are an AI fairness and compliance monitor.\n"
        "Review the candidate's resume data and the reasoning provided by the matching agent.\n\n"
        "Candidate Data:\n"
        "Name: {candidate_name}\n"
        "Education: {candidate_edu}\n\n"
        "Matcher Score: {score}\n"
        "Matcher Reasoning: {reasoning}\n\n"
        "Task: Determine if the Matcher Reasoning contains any potential biases (e.g., gender, race, "
        "age, or over-indexing on a specific university/education tier when it's not a strict requirement).\n"
        "Return whether bias was detected and a list of specific concerns."
    )
    
    chain = prompt | structured_llm
    
    parsed_resume = state["parsed_resume"]
    match_score = state["match_score"]
    
    print(f"--- DETECTING BIAS FOR: {parsed_resume.candidate_name} ---")
    
    result = chain.invoke({
        "candidate_name": parsed_resume.candidate_name,
        "candidate_edu": ", ".join(parsed_resume.education),
        "score": match_score.score,
        "reasoning": match_score.reasoning
    })
    
    return {"bias_report": result}
