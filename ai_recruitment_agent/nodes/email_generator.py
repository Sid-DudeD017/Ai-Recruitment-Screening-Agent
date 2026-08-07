from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from ai_recruitment_agent.state import GraphState
from ai_recruitment_agent.llm import get_llm
from langchain_core.output_parsers import StrOutputParser

def generate_email(state: GraphState) -> Dict[str, Any]:
    """Node that generates a personalized email based on the match score."""
    llm = get_llm()
    
    prompt = PromptTemplate.from_template(
        "You are a polite and professional technical recruiter.\n"
        "Write a short, personalized email to the candidate regarding their application for the '{job_title}' position.\n"
        "Candidate Name: {candidate_name}\n"
        "Match Score: {score}/100\n\n"
        "If the score is 75 or above, the email should be an invitation for a first-round interview.\n"
        "If the score is below 75, the email should be a polite rejection.\n"
        "Do not mention the exact score in the email. Keep it professional and empathetic.\n\n"
        "Email Draft:"
    )
    
    chain = prompt | llm | StrOutputParser()
    
    parsed_job = state["parsed_job"]
    parsed_resume = state["parsed_resume"]
    match_score = state["match_score"]
    
    print(f"--- GENERATING EMAIL FOR: {parsed_resume.candidate_name} ---")
    
    result = chain.invoke({
        "job_title": parsed_job.title,
        "candidate_name": parsed_resume.candidate_name,
        "score": match_score.score
    })
    
    return {"generated_email": result}
