from typing import Dict, Any
from langchain_core.prompts import PromptTemplate
from ai_recruitment_agent.state import GraphState, MatchScore
from ai_recruitment_agent.llm import get_llm

def match_candidate(state: GraphState) -> Dict[str, Any]:
    """Node that compares the parsed resume against the parsed job description."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(MatchScore)
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical recruiter matching a candidate to a job.\n"
        "Review the Job Requirements and the Candidate's Resume Data below.\n\n"
        "Job Requirements:\n"
        "Title: {job_title}\n"
        "Must-have skills: {must_haves}\n"
        "Nice-to-have skills: {nice_haves}\n"
        "Required Experience (years): {job_exp}\n\n"
        "Candidate Resume Data:\n"
        "Name: {candidate_name}\n"
        "Skills: {candidate_skills}\n"
        "Experience (years): {candidate_exp}\n"
        "Education: {candidate_edu}\n\n"
        "Task: Calculate a match score from 0 to 100 representing how well the candidate fits the job. "
        "Weight must-have skills heavily. Provide qualitative reasoning for your score."
    )
    
    chain = prompt | structured_llm
    
    parsed_job = state["parsed_job"]
    parsed_resume = state["parsed_resume"]
    
    print(f"--- MATCHING CANDIDATE: {parsed_resume.candidate_name} ---")
    
    result = chain.invoke({
        "job_title": parsed_job.title,
        "must_haves": ", ".join(parsed_job.must_have_skills),
        "nice_haves": ", ".join(parsed_job.nice_to_have_skills),
        "job_exp": parsed_job.years_of_experience if parsed_job.years_of_experience is not None else "Not specified",
        "candidate_name": parsed_resume.candidate_name,
        "candidate_skills": ", ".join(parsed_resume.skills),
        "candidate_exp": parsed_resume.experience_years if parsed_resume.experience_years is not None else "Unknown",
        "candidate_edu": ", ".join(parsed_resume.education)
    })
    
    return {"match_score": result}
